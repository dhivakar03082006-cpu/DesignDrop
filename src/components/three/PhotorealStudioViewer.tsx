import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore.ts';
import { useT } from '../../hooks/useT.ts';
import type { Product3DViewerProps } from './Product3DViewer.tsx';
import {
  STUDIO_ANGLES,
  getDefaultEditorialArtwork,
  isLightHex,
  loadExtractedStudioPhoto,
  renderPhotorealFrameToDataUrl,
  type ExtractedPhotoData,
} from './photoStudioEngine.ts';
import type { ProductType } from '../../types/index.ts';

interface RenderedAngleSet {
  angles: number[];
  urls: string[];
}

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function shortestAngleDiff(from: number, to: number): number {
  let diff = ((to - from + 540) % 360) - 180;
  if (diff < -180) diff += 360;
  return diff;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Computes the enclosing pair of real photographed angles and applies
 * GPU-accelerated CSS 3D perspective-matched transforms directly to pre-mounted
 * <img> DOM nodes (zero React re-renders per frame -> silky 60fps 360° spin).
 */
function updateProductLayers(
  layerEls: Array<HTMLImageElement | null>,
  shadowEl: HTMLDivElement | null,
  angles: number[],
  angleDeg: number,
  tiltXDeg: number,
  floatYpx: number,
  zoom: number
) {
  const count = angles.length;
  if (count === 0) return;

  const deg = normalizeDeg(angleDeg);

  let idxA = 0;
  let idxB = 0;
  let progress = 0;
  let spanDeg = 45;

  if (count > 1) {
    for (let i = 0; i < count; i++) {
      const a0 = angles[i];
      const next = (i + 1) % count;
      const a1 = next === 0 ? angles[0] + 360 : angles[next];
      const testDeg = deg < angles[0] ? deg + 360 : deg;
      if (testDeg >= a0 && testDeg <= a1) {
        idxA = i;
        idxB = next;
        spanDeg = Math.max(1, a1 - a0);
        progress = (testDeg - a0) / spanDeg;
        break;
      }
    }
  }

  // Tight perspective-matched handoff window eliminates double-ghosting
  const blend = smoothstep(0.35, 0.65, progress);

  // Subtle physical 3D turn between adjacent photographed angles
  const maxSwing = Math.min(15, spanDeg * 0.34);
  const swingA = -progress * maxSwing;
  const swingB = (1 - progress) * maxSwing;

  // Keep silhouette width visually constant across the midpoint handoff
  const midBoost = 1 + (1 - Math.abs(progress - 0.5) * 2) * 0.014;

  for (let i = 0; i < count; i++) {
    const el = layerEls[i];
    if (!el) continue;

    if (idxA === idxB && i === idxA) {
      el.style.visibility = 'visible';
      el.style.opacity = '1';
      el.style.transform = `translate3d(0px, ${floatYpx.toFixed(2)}px, 0px) rotateX(${tiltXDeg.toFixed(2)}deg) rotateY(${swingA.toFixed(2)}deg) scale(${zoom.toFixed(4)})`;
    } else if (i === idxA && blend < 0.996) {
      const opA = 1 - blend;
      el.style.visibility = 'visible';
      el.style.opacity = opA.toFixed(4);
      el.style.transform = `translate3d(0px, ${floatYpx.toFixed(2)}px, 0px) rotateX(${tiltXDeg.toFixed(2)}deg) rotateY(${swingA.toFixed(2)}deg) scale(${(zoom * midBoost).toFixed(4)})`;
    } else if (i === idxB && blend > 0.004) {
      el.style.visibility = 'visible';
      el.style.opacity = blend.toFixed(4);
      el.style.transform = `translate3d(0px, ${floatYpx.toFixed(2)}px, 0px) rotateX(${tiltXDeg.toFixed(2)}deg) rotateY(${swingB.toFixed(2)}deg) scale(${(zoom * midBoost).toFixed(4)})`;
    } else {
      if (el.style.visibility !== 'hidden') {
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
      }
    }
  }

  if (shadowEl) {
    // Grounded contact shadow subtly breathes inversely with levitation height
    const breath = 1 - floatYpx * 0.008;
    shadowEl.style.transform = `translate3d(-50%, 0, 0) scale(${(zoom * breath).toFixed(3)}, ${(zoom * breath).toFixed(3)})`;
  }
}

export const PhotorealStudioViewer: React.FC<Product3DViewerProps> = ({
  productType,
  colorHex,
  printArea = 'front',
  textureSourceUrl,
  interactive = true,
  heroMode = false,
  showDualHero = false,
  autoSpin = false,
  lightingMood = 'daylight',
  externalRotationY,
  className = '',
  onCameraPreset,
}) => {
  const t = useT();
  const liteMode = useAppStore((s) => s.liteMode);

  const [isReady, setIsReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [displayAngleDeg, setDisplayAngleDeg] = useState(0);
  const [primarySet, setPrimarySet] = useState<RenderedAngleSet | null>(null);
  const [mugSet, setMugSet] = useState<RenderedAngleSet | null>(null);

  const primarySetRef = useRef<RenderedAngleSet | null>(null);
  const mugSetRef = useRef<RenderedAngleSet | null>(null);
  const primaryImgRefs = useRef<Array<HTMLImageElement | null>>([]);
  const mugImgRefs = useRef<Array<HTMLImageElement | null>>([]);
  const primaryShadowRef = useRef<HTMLDivElement | null>(null);
  const mugShadowRef = useRef<HTMLDivElement | null>(null);
  const artworkImgRef = useRef<HTMLImageElement | null>(null);

  const animRef = useRef({
    angleDeg: 0,
    targetAngleDeg: null as number | null,
    velocityDeg: 0,
    tiltXDeg: 0,
    targetTiltXDeg: 0,
    zoom: 1,
    targetZoom: 1,
    dragging: false,
    lastPointerX: 0,
    lastPointerY: 0,
    resumeSpinAt: 0,
  });

  const propsRef = useRef({
    autoSpin,
    heroMode,
    showDualHero,
    interactive,
    liteMode,
    externalRotationY,
    productType,
  });
  propsRef.current = {
    autoSpin,
    heroMode,
    showDualHero,
    interactive,
    liteMode,
    externalRotationY,
    productType,
  };

  // Load custom uploaded artwork image when textureSourceUrl changes
  const [artworkVersion, setArtworkVersion] = useState(0);
  useEffect(() => {
    if (!textureSourceUrl) {
      artworkImgRef.current = null;
      setArtworkVersion((v) => v + 1);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      artworkImgRef.current = img;
      setArtworkVersion((v) => v + 1);
    };
    img.src = textureSourceUrl;
    return () => {
      cancelled = true;
    };
  }, [textureSourceUrl]);

  // Smoothly turn to front, side, or back when camera preset or printArea changes
  useEffect(() => {
    if (!onCameraPreset) return;
    const target =
      onCameraPreset === 'back' ? 180 : onCameraPreset === 'side' ? 90 : 0;
    animRef.current.targetAngleDeg = target;
    animRef.current.velocityDeg = 0;
  }, [onCameraPreset]);

  useEffect(() => {
    if (productType === 'tshirt' || productType === 'hoodie') {
      if (printArea === 'back') {
        animRef.current.targetAngleDeg = 180;
      } else if (printArea === 'front') {
        animRef.current.targetAngleDeg = 0;
      }
    }
  }, [printArea, productType]);

  // Preload, normalize, dye, and pre-decode all studio angles
  useEffect(() => {
    let cancelled = false;

    const buildSet = async (
      type: ProductType,
      hex: string,
      area: 'front' | 'back' | 'wrap' | 'none'
    ): Promise<RenderedAngleSet> => {
      const defs = STUDIO_ANGLES[type];
      const extracted: ExtractedPhotoData[] = await Promise.all(
        defs.map((d) =>
          loadExtractedStudioPhoto(
            d.src,
            Boolean(d.mirrorX),
            type === 'mug',
            type === 'mug' ? 0.78 : 0.85
          )
        )
      );

      const artSource =
        artworkImgRef.current || getDefaultEditorialArtwork(isLightHex(hex));

      const urls = defs.map((def, idx) =>
        renderPhotorealFrameToDataUrl(extracted[idx], def, {
          productType: type,
          colorHex: hex,
          printArea: area,
          artworkImage: artSource,
          lightingMood,
        })
      );

      // Pre-decode data URLs before swapping so frames never blink
      await Promise.all(
        urls.map(
          (url) =>
            new Promise<void>((res) => {
              const pre = new Image();
              pre.onload = () => res();
              pre.onerror = () => res();
              pre.src = url;
            })
        )
      );

      return {
        angles: defs.map((d) => d.angleDeg),
        urls,
      };
    };

    const run = async () => {
      try {
        if (showDualHero) {
          const [shirtSet, secondaryMugSet] = await Promise.all([
            buildSet('tshirt', colorHex, 'front'),
            buildSet('mug', '#FAF9F6', 'wrap'),
          ]);
          if (cancelled) return;
          primarySetRef.current = shirtSet;
          mugSetRef.current = secondaryMugSet;
          primaryImgRefs.current = [];
          mugImgRefs.current = [];
          setPrimarySet(shirtSet);
          setMugSet(secondaryMugSet);
        } else {
          const mainSet = await buildSet(productType, colorHex, printArea);
          if (cancelled) return;
          primarySetRef.current = mainSet;
          mugSetRef.current = null;
          primaryImgRefs.current = [];
          mugImgRefs.current = [];
          setPrimarySet(mainSet);
          setMugSet(null);
        }
        setIsReady(true);
      } catch {
        if (!cancelled) setIsReady(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [productType, colorHex, printArea, showDualHero, lightingMood, artworkVersion]);

  // 60fps GPU-Composited Turntable Animation Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let lastLabelUpdate = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const cur = propsRef.current;
      const state = animRef.current;
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      // Physics-driven smooth turntable motion (spring target, drag inertia, scroll, or auto-spin)
      if (!state.dragging) {
        if (state.targetAngleDeg !== null) {
          const diff = shortestAngleDiff(state.angleDeg, state.targetAngleDeg);
          if (Math.abs(diff) < 0.35) {
            state.angleDeg = normalizeDeg(state.targetAngleDeg);
            state.targetAngleDeg = null;
          } else {
            state.angleDeg = normalizeDeg(
              state.angleDeg + diff * Math.min(1, dt * 8.2)
            );
          }
        } else if (Math.abs(state.velocityDeg) > 0.8) {
          state.angleDeg = normalizeDeg(state.angleDeg + state.velocityDeg * dt);
          state.velocityDeg *= Math.exp(-dt * 4.2);
        } else if (typeof cur.externalRotationY === 'number' && !cur.autoSpin) {
          const extDeg = normalizeDeg((cur.externalRotationY * 180) / Math.PI);
          const diff = shortestAngleDiff(state.angleDeg, extDeg);
          state.angleDeg = normalizeDeg(
            state.angleDeg + diff * Math.min(1, dt * 8.5)
          );
        } else if (
          (cur.autoSpin || cur.heroMode) &&
          !cur.liteMode &&
          !reduced &&
          now > state.resumeSpinAt
        ) {
          // Silky luxury showcase rotation speed
          const speed = cur.showDualHero ? 22 : 26;
          state.angleDeg = normalizeDeg(state.angleDeg + speed * dt);
        }
        state.targetTiltXDeg = 0;
      }

      state.tiltXDeg += (state.targetTiltXDeg - state.tiltXDeg) * Math.min(1, dt * 8);
      state.zoom += (state.targetZoom - state.zoom) * Math.min(1, dt * 9);

      // Update numeric angle HUD at ~10fps without touching the 60fps GPU layers
      if (now - lastLabelUpdate > 95) {
        lastLabelUpdate = now;
        setDisplayAngleDeg(Math.round(state.angleDeg));
      }

      const floatY =
        !cur.liteMode && !reduced ? Math.sin(now * 0.0017) * 4.5 : 0;

      if (primarySetRef.current) {
        updateProductLayers(
          primaryImgRefs.current,
          primaryShadowRef.current,
          primarySetRef.current.angles,
          state.angleDeg,
          state.tiltXDeg,
          floatY,
          state.zoom
        );
      }

      if (cur.showDualHero && mugSetRef.current) {
        updateProductLayers(
          mugImgRefs.current,
          mugShadowRef.current,
          mugSetRef.current.angles,
          state.angleDeg * 1.12,
          state.tiltXDeg * 0.55,
          floatY * 0.55,
          state.zoom
        );
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Tactile pointer drag handlers with spring momentum
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    animRef.current.dragging = true;
    animRef.current.targetAngleDeg = null;
    animRef.current.velocityDeg = 0;
    animRef.current.lastPointerX = e.clientX;
    animRef.current.lastPointerY = e.clientY;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!animRef.current.dragging) return;
    const dx = e.clientX - animRef.current.lastPointerX;
    const dy = e.clientY - animRef.current.lastPointerY;
    animRef.current.lastPointerX = e.clientX;
    animRef.current.lastPointerY = e.clientY;

    const deltaDeg = dx * 0.65;
    animRef.current.angleDeg = normalizeDeg(animRef.current.angleDeg + deltaDeg);
    animRef.current.velocityDeg = deltaDeg * 26;
    animRef.current.targetTiltXDeg = Math.max(
      -9,
      Math.min(9, animRef.current.targetTiltXDeg - dy * 0.1)
    );
  };

  const handlePointerUp = () => {
    if (!animRef.current.dragging) return;
    animRef.current.dragging = false;
    animRef.current.resumeSpinAt = performance.now() + 2600;
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (!interactive) return;
    animRef.current.targetZoom = animRef.current.targetZoom > 1.08 ? 1 : 1.22;
  };

  const ringBorderColor =
    lightingMood === 'violet'
      ? 'border-violet-500/35'
      : lightingMood === 'sunset'
        ? 'border-rose-400/35'
        : 'border-slate-400/25 dark:border-white/15';

  return (
    <div
      data-cursor="3d"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      className={`relative h-full w-full select-none touch-none overflow-hidden ${
        interactive ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
      } ${className}`}
      aria-label={`Interactive 360 degree photorealistic preview of ${productType}`}
      role="img"
    >
      {!isReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-[#14141B]/75 text-sm font-medium text-[#F5F5F7]">
          {t.studio.getting3DReady}
        </div>
      )}

      {/* Subtle architectural floor turntable ellipse */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 bottom-[13%] h-[11%] w-[70%] -translate-x-1/2 rounded-[100%] border ${ringBorderColor}`}
      />

      {/* GPU 3D Perspective Stage */}
      <div
        className="pointer-events-none relative h-full w-full"
        style={{ perspective: '1250px' }}
      >
        {/* Primary Product (Full Center or Left-Center in Dual Hero) */}
        {primarySet && (
          <div
            className={`absolute ${
              showDualHero
                ? 'left-[4%] top-[6%] h-[78%] w-[72%]'
                : productType === 'mug'
                  ? 'left-1/2 top-[9%] h-[74%] w-[74%] -translate-x-1/2'
                  : 'left-1/2 top-[4%] h-[82%] w-[82%] -translate-x-1/2'
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Grounded soft studio contact shadow */}
            <div
              ref={primaryShadowRef}
              aria-hidden="true"
              className="absolute bottom-[3%] left-1/2 h-[11%] w-[56%] rounded-[100%] bg-black/30 blur-xl dark:bg-black/55"
              style={{ transform: 'translate3d(-50%, 0, 0)' }}
            />

            {primarySet.urls.map((url, idx) => (
              <img
                key={`${primarySet.angles[idx]}-${idx}`}
                ref={(el) => {
                  primaryImgRefs.current[idx] = el;
                }}
                src={url}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain will-change-transform"
                style={{
                  opacity: idx === 0 ? 1 : 0,
                  visibility: idx === 0 ? 'visible' : 'hidden',
                  backfaceVisibility: 'hidden',
                }}
              />
            ))}
          </div>
        )}

        {/* Secondary Real Ceramic Mug in Dual Hero Mode */}
        {showDualHero && mugSet && (
          <div
            className="absolute right-[5%] bottom-[13%] h-[46%] w-[44%]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              ref={mugShadowRef}
              aria-hidden="true"
              className="absolute bottom-[3%] left-1/2 h-[13%] w-[54%] rounded-[100%] bg-black/32 blur-lg dark:bg-black/60"
              style={{ transform: 'translate3d(-50%, 0, 0)' }}
            />

            {mugSet.urls.map((url, idx) => (
              <img
                key={`mug-${mugSet.angles[idx]}-${idx}`}
                ref={(el) => {
                  mugImgRefs.current[idx] = el;
                }}
                src={url}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain will-change-transform"
                style={{
                  opacity: idx === 0 ? 1 : 0,
                  visibility: idx === 0 ? 'visible' : 'hidden',
                  backfaceVisibility: 'hidden',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Subtle top-right 360° live angle readout */}
      {isReady && (
        <div className="pointer-events-none absolute top-3.5 right-3.5 z-10 rounded-lg border border-black/8 bg-white/88 px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums text-zinc-700 dark:border-white/10 dark:bg-[#14141B]/88 dark:text-zinc-300">
          {displayAngleDeg}°
        </div>
      )}
    </div>
  );
};

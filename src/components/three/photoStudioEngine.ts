import type { ProductType } from '../../types/index.ts';
import type { LightingMood } from './Product3DViewer.tsx';

export interface StudioAngleDef {
  angleDeg: number;
  src: string;
  mirrorX?: boolean;
  /** Printable surface visible on this angle */
  face: 'front' | 'back' | 'wrap' | 'none';
  /** Normalized print box [cx, cy, w, h] relative to square canvas (0..1) */
  printBox?: {
    cx: number;
    cy: number;
    w: number;
    h: number;
    skewYDeg?: number;
    scaleX?: number;
    cylindricalCurve?: boolean;
  };
}

export const STUDIO_ANGLES: Record<ProductType, StudioAngleDef[]> = {
  // Complete 8-angle 45° ring around 360° for ultra-smooth rotation
  tshirt: [
    {
      angleDeg: 0,
      src: '/src/assets/images/studio_tshirt_front_1795094233776.jpg',
      face: 'front',
      printBox: { cx: 0.5, cy: 0.45, w: 0.34, h: 0.38 },
    },
    {
      angleDeg: 45,
      src: '/src/assets/images/studio_tshirt_right_1795094286019.jpg',
      face: 'front',
      printBox: { cx: 0.42, cy: 0.45, w: 0.28, h: 0.37, skewYDeg: 4, scaleX: 0.82 },
    },
    {
      angleDeg: 90,
      src: '/src/assets/images/studio_tshirt_side_1795095300557.jpg',
      face: 'none',
    },
    {
      angleDeg: 135,
      src: '/src/assets/images/studio_tshirt_back_right_1795094328509.jpg',
      face: 'back',
      printBox: { cx: 0.43, cy: 0.44, w: 0.28, h: 0.37, skewYDeg: -4, scaleX: 0.82 },
    },
    {
      angleDeg: 180,
      src: '/src/assets/images/studio_tshirt_back_1795094304798.jpg',
      face: 'back',
      printBox: { cx: 0.5, cy: 0.43, w: 0.34, h: 0.38 },
    },
    {
      angleDeg: 225,
      src: '/src/assets/images/studio_tshirt_back_right_1795094328509.jpg',
      mirrorX: true,
      face: 'back',
      printBox: { cx: 0.57, cy: 0.44, w: 0.28, h: 0.37, skewYDeg: 4, scaleX: 0.82 },
    },
    {
      angleDeg: 270,
      src: '/src/assets/images/studio_tshirt_side_1795095300557.jpg',
      mirrorX: true,
      face: 'none',
    },
    {
      angleDeg: 315,
      src: '/src/assets/images/studio_tshirt_left_1795094285500.jpg',
      face: 'front',
      printBox: { cx: 0.58, cy: 0.45, w: 0.28, h: 0.37, skewYDeg: -4, scaleX: 0.82 },
    },
  ],
  // Complete 4-angle 90° ring around 360° for glossy ceramic mug
  mug: [
    {
      angleDeg: 0,
      src: '/src/assets/images/studio_mug_front_1795094257443.jpg',
      face: 'wrap',
      printBox: { cx: 0.415, cy: 0.535, w: 0.38, h: 0.44, cylindricalCurve: true },
    },
    {
      angleDeg: 90,
      src: '/src/assets/images/studio_mug_handle_front_1795095299110.jpg',
      face: 'none',
    },
    {
      angleDeg: 180,
      src: '/src/assets/images/studio_mug_angle_1795094285939.jpg',
      face: 'wrap',
      printBox: { cx: 0.585, cy: 0.535, w: 0.38, h: 0.44, cylindricalCurve: true },
    },
    {
      angleDeg: 270,
      src: '/src/assets/images/studio_mug_center_1795094329204.jpg',
      face: 'wrap',
      printBox: { cx: 0.5, cy: 0.535, w: 0.41, h: 0.45, cylindricalCurve: true },
    },
  ],
  hoodie: [
    {
      angleDeg: 0,
      src: '/src/assets/images/studio_hoodie_front_1795094235187.jpg',
      face: 'front',
      printBox: { cx: 0.5, cy: 0.44, w: 0.28, h: 0.28 },
    },
    {
      angleDeg: 180,
      src: '/src/assets/images/studio_hoodie_back_1795094285509.jpg',
      face: 'back',
      printBox: { cx: 0.5, cy: 0.5, w: 0.31, h: 0.34 },
    },
  ],
  cap: [
    {
      angleDeg: 0,
      src: '/src/assets/images/studio_cap_front_1795094235228.jpg',
      face: 'front',
      printBox: { cx: 0.53, cy: 0.41, w: 0.24, h: 0.2, skewYDeg: -5 },
    },
    {
      angleDeg: 180,
      src: '/src/assets/images/studio_cap_front_1795094235228.jpg',
      mirrorX: true,
      face: 'front',
      printBox: { cx: 0.47, cy: 0.41, w: 0.24, h: 0.2, skewYDeg: 5 },
    },
  ],
};

export interface ExtractedPhotoData {
  width: number;
  height: number;
  alpha: Uint8Array;
  lum: Float32Array;
  meanLum: number;
}

const PHOTO_SIZE = 540;
const extractedCache = new Map<string, Promise<ExtractedPhotoData>>();

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const num = parseInt(full.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function isLightHex(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.5;
}

/**
 * Extracts clean feathered alpha cutout from pure-white studio photography AND normalizes
 * the product's bounding height & vertical alignment so every angle rotates around the exact
 * same center axis with zero vertical bobbing or scale jumping.
 */
export function loadExtractedStudioPhoto(
  src: string,
  mirrorX = false,
  stripEnclosedWhite = false,
  targetFillHeight = 0.84
): Promise<ExtractedPhotoData> {
  const cacheKey = `${src}|${mirrorX ? 'M' : 'N'}|${stripEnclosedWhite ? 'H' : 'S'}|${targetFillHeight}`;
  const existing = extractedCache.get(cacheKey);
  if (existing) return existing;

  const promise = new Promise<ExtractedPhotoData>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = PHOTO_SIZE;
      const h = PHOTO_SIZE;
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = w;
      rawCanvas.height = h;
      const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true })!;
      if (mirrorX) {
        rawCtx.translate(w, 0);
        rawCtx.scale(-1, 1);
      }
      rawCtx.drawImage(img, 0, 0, w, h);

      const rawImgData = rawCtx.getImageData(0, 0, w, h);
      const data = rawImgData.data;
      const total = w * h;
      const isBg = new Uint8Array(total);
      const queue = new Int32Array(total);
      let head = 0;
      let tail = 0;

      const isPureBackdrop = (idx: number, threshold: number) => {
        const o = idx * 4;
        const r = data[o];
        const g = data[o + 1];
        const b = data[o + 2];
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        return minC >= threshold && maxC - minC <= 14;
      };

      const trySeed = (idx: number) => {
        if (!isBg[idx] && isPureBackdrop(idx, 240)) {
          isBg[idx] = 1;
          queue[tail++] = idx;
        }
      };

      for (let x = 0; x < w; x++) {
        trySeed(x);
        trySeed((h - 1) * w + x);
      }
      for (let y = 0; y < h; y++) {
        trySeed(y * w);
        trySeed(y * w + (w - 1));
      }

      while (head < tail) {
        const idx = queue[head++];
        const x = idx % w;
        const y = (idx - x) / w;
        if (x > 0 && !isBg[idx - 1] && isPureBackdrop(idx - 1, 238)) {
          isBg[idx - 1] = 1;
          queue[tail++] = idx - 1;
        }
        if (x < w - 1 && !isBg[idx + 1] && isPureBackdrop(idx + 1, 238)) {
          isBg[idx + 1] = 1;
          queue[tail++] = idx + 1;
        }
        if (y > 0 && !isBg[idx - w] && isPureBackdrop(idx - w, 238)) {
          isBg[idx - w] = 1;
          queue[tail++] = idx - w;
        }
        if (y < h - 1 && !isBg[idx + w] && isPureBackdrop(idx + w, 238)) {
          isBg[idx + w] = 1;
          queue[tail++] = idx + w;
        }
      }

      // Remove enclosed white opening inside ceramic mug C-handle
      if (stripEnclosedWhite) {
        const visited = new Uint8Array(total);
        const compQueue = new Int32Array(total);
        for (let i = 0; i < total; i++) {
          if (isBg[i] || visited[i]) continue;
          if (!isPureBackdrop(i, 246)) continue;
          let ch = 0;
          let ct = 0;
          visited[i] = 1;
          compQueue[ct++] = i;
          while (ch < ct) {
            const cur = compQueue[ch++];
            const cx = cur % w;
            const cy = (cur - cx) / w;
            const neighbors = [
              cx > 0 ? cur - 1 : -1,
              cx < w - 1 ? cur + 1 : -1,
              cy > 0 ? cur - w : -1,
              cy < h - 1 ? cur + w : -1,
            ];
            for (const nb of neighbors) {
              if (nb >= 0 && !isBg[nb] && !visited[nb] && isPureBackdrop(nb, 241)) {
                visited[nb] = 1;
                compQueue[ct++] = nb;
              }
            }
          }
          if (ct > 750) {
            for (let k = 0; k < ct; k++) {
              isBg[compQueue[k]] = 1;
            }
          }
        }
      }

      // Apply soft feathered alpha to rawImgData and find exact foreground bounding box
      let minX = w;
      let maxX = 0;
      let minY = h;
      let maxY = 0;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const o = i * 4;
          if (isBg[i]) {
            data[o + 3] = 0;
          } else {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (x > 0 && x < w - 1 && y > 0 && y < h - 1) {
              const bgAdj =
                (isBg[i - 1] ? 1 : 0) +
                (isBg[i + 1] ? 1 : 0) +
                (isBg[i - w] ? 1 : 0) +
                (isBg[i + w] ? 1 : 0);
              if (bgAdj > 0) {
                const l = (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) / 255;
                const fade = Math.max(0, Math.min(1, (0.98 - l) / 0.14));
                data[o + 3] = Math.round(255 * Math.min(1, 0.32 + fade * 0.68));
              }
            }
          }
        }
      }
      rawCtx.putImageData(rawImgData, 0, 0);

      // Normalize height & center-align across every angle so 360° rotation never bobs or jumps!
      const boxW = Math.max(1, maxX - minX + 1);
      const boxH = Math.max(1, maxY - minY + 1);
      const scale = Math.min((h * targetFillHeight) / boxH, (w * 0.90) / boxW);
      const destW = boxW * scale;
      const destH = boxH * scale;
      const destX = (w - destW) / 2;
      const destY = (h - destH) / 2;

      const normCanvas = document.createElement('canvas');
      normCanvas.width = w;
      normCanvas.height = h;
      const normCtx = normCanvas.getContext('2d', { willReadFrequently: true })!;
      normCtx.imageSmoothingEnabled = true;
      normCtx.imageSmoothingQuality = 'high';
      normCtx.drawImage(rawCanvas, minX, minY, boxW, boxH, destX, destY, destW, destH);

      const normData = normCtx.getImageData(0, 0, w, h).data;
      const lum = new Float32Array(total);
      const alpha = new Uint8Array(total);
      let sumLum = 0;
      let fgCount = 0;

      for (let i = 0; i < total; i++) {
        const o = i * 4;
        const a = normData[o + 3];
        alpha[i] = a;
        if (a > 12) {
          const l = (0.2126 * normData[o] + 0.7152 * normData[o + 1] + 0.0722 * normData[o + 2]) / 255;
          lum[i] = l;
          sumLum += l;
          fgCount++;
        }
      }

      const meanLum = fgCount > 0 ? sumLum / fgCount : 0.76;
      resolve({ width: w, height: h, alpha, lum, meanLum });
    };
    img.onerror = () => reject(new Error(`Failed to load studio photo: ${src}`));
    img.src = src;
  });

  extractedCache.set(cacheKey, promise);
  return promise;
}

let cachedDefaultLightArt: HTMLCanvasElement | null = null;
let cachedDefaultDarkArt: HTMLCanvasElement | null = null;

export function getDefaultEditorialArtwork(isLightGarment: boolean): HTMLCanvasElement {
  if (isLightGarment && cachedDefaultLightArt) return cachedDefaultLightArt;
  if (!isLightGarment && cachedDefaultDarkArt) return cachedDefaultDarkArt;

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 640, 640);

  const ink = isLightGarment ? '#16161C' : '#F4F4F6';
  const sub = isLightGarment ? '#52525B' : '#B4B4BE';

  const grad = ctx.createLinearGradient(150, 110, 490, 450);
  grad.addColorStop(0, '#7C3AED');
  grad.addColorStop(0.55, '#EC4899');
  grad.addColorStop(1, '#FF5A5F');

  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.strokeRect(128, 102, 384, 434);

  ctx.beginPath();
  ctx.arc(320, 266, 110, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(195, 290 + i * 20, 250, 7 + i);
  }
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = ink;
  ctx.font = '800 44px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DESIGNDROP', 320, 448);

  ctx.fillStyle = sub;
  ctx.font = '600 17px system-ui, -apple-system, sans-serif';
  ctx.fillText('STUDIO EDITION · 240 GSM', 320, 484);

  ctx.fillStyle = ink;
  ctx.font = '600 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('CUSTOM PRINT LAB', 320, 514);

  if (isLightGarment) cachedDefaultLightArt = canvas;
  else cachedDefaultDarkArt = canvas;
  return canvas;
}

/**
 * Renders a dyed, height-normalized photorealistic studio angle to a data URL
 * so the GPU CSS 3D turntable can rotate & perspective-align frames at silky 60fps.
 */
export function renderPhotorealFrameToDataUrl(
  photo: ExtractedPhotoData,
  angleDef: StudioAngleDef,
  options: {
    productType: ProductType;
    colorHex: string;
    printArea: 'front' | 'back' | 'wrap' | 'none';
    artworkImage: HTMLImageElement | HTMLCanvasElement | null;
    lightingMood: LightingMood;
  }
): string {
  const { width: w, height: h, alpha, lum, meanLum } = photo;
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = w;
  targetCanvas.height = h;
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true })!;
  const imgData = ctx.createImageData(w, h);
  const out = imgData.data;

  const [tr, tg, tb] = hexToRgb(options.colorHex);
  const targetLum = (0.2126 * tr + 0.7152 * tg + 0.0722 * tb) / 255;
  const isCeramic = options.productType === 'mug';

  let moodR = 1;
  let moodG = 1;
  let moodB = 1;
  if (options.lightingMood === 'violet') {
    moodR = 0.99;
    moodG = 0.95;
    moodB = 1.07;
  } else if (options.lightingMood === 'sunset') {
    moodR = 1.06;
    moodG = 0.98;
    moodB = 0.93;
  }

  const normBase = Math.max(0.68, meanLum * 1.04);

  for (let i = 0; i < w * h; i++) {
    const a = alpha[i];
    if (a === 0) continue;

    const rawL = lum[i];
    const normL = Math.max(0.06, Math.min(1.42, rawL / normBase));

    let r: number;
    let g: number;
    let b: number;

    if (isCeramic) {
      const diffuse = Math.pow(normL, 0.95);
      const specular =
        rawL > 0.84 ? Math.pow((rawL - 0.84) / 0.16, 1.75) * (150 - targetLum * 70) : 0;
      r = tr * diffuse + specular;
      g = tg * diffuse + specular;
      b = tb * diffuse + specular;
    } else {
      const foldCurve = targetLum < 0.25 ? Math.pow(normL, 1.22) : Math.pow(normL, 1.12);
      const cottonSheen =
        targetLum < 0.35
          ? Math.pow(Math.max(0, normL - 0.72), 1.85) * (54 * (1 - targetLum))
          : Math.pow(Math.max(0, normL - 0.95), 2.0) * 18;
      const darkFloor = targetLum < 0.18 ? 10 * normL : 0;
      r = tr * foldCurve + cottonSheen + darkFloor;
      g = tg * foldCurve + cottonSheen + darkFloor;
      b = tb * foldCurve + cottonSheen + darkFloor;
    }

    const o = i * 4;
    out[o] = Math.max(0, Math.min(255, Math.round(r * moodR)));
    out[o + 1] = Math.max(0, Math.min(255, Math.round(g * moodG)));
    out[o + 2] = Math.max(0, Math.min(255, Math.round(b * moodB)));
    out[o + 3] = a;
  }

  ctx.putImageData(imgData, 0, 0);

  const shouldDrawArt =
    options.printArea !== 'none' &&
    angleDef.printBox &&
    ((options.productType === 'mug' && angleDef.face === 'wrap') ||
      (options.productType === 'cap' && angleDef.face === 'front') ||
      (options.printArea === 'front' && angleDef.face === 'front') ||
      (options.printArea === 'back' && angleDef.face === 'back'));

  if (shouldDrawArt && angleDef.printBox && options.artworkImage) {
    const artCanvas = document.createElement('canvas');
    artCanvas.width = w;
    artCanvas.height = h;
    const artCtx = artCanvas.getContext('2d', { willReadFrequently: true })!;

    const box = angleDef.printBox;
    const drawW = box.w * w * (box.scaleX ?? 1);
    const drawH = box.h * h;
    const cx = box.cx * w;
    const cy = box.cy * h;

    artCtx.save();
    artCtx.translate(cx, cy);
    if (box.skewYDeg) {
      artCtx.transform(1, Math.tan((box.skewYDeg * Math.PI) / 180), 0, 1, 0, 0);
    }

    if (box.cylindricalCurve) {
      const slices = 24;
      const srcW =
        options.artworkImage instanceof HTMLCanvasElement
          ? options.artworkImage.width
          : options.artworkImage.naturalWidth || 512;
      const srcH =
        options.artworkImage instanceof HTMLCanvasElement
          ? options.artworkImage.height
          : options.artworkImage.naturalHeight || 512;

      for (let s = 0; s < slices; s++) {
        const t0 = s / slices;
        const t1 = (s + 1) / slices;
        const mid = (t0 + t1) * 0.5;
        const u = (mid - 0.5) * 2;
        const curveY = (1 - Math.sqrt(Math.max(0.05, 1 - u * u * 0.48))) * 14;
        const dx = -drawW / 2 + t0 * drawW;
        const dw = (t1 - t0) * drawW + 0.6;
        artCtx.drawImage(
          options.artworkImage,
          t0 * srcW,
          0,
          (t1 - t0) * srcW,
          srcH,
          dx,
          -drawH / 2 + curveY,
          dw,
          drawH
        );
      }
    } else {
      artCtx.drawImage(options.artworkImage, -drawW / 2, -drawH / 2, drawW, drawH);
    }
    artCtx.restore();

    const artData = artCtx.getImageData(0, 0, w, h).data;
    const baseImg = ctx.getImageData(0, 0, w, h);
    const dst = baseImg.data;

    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      const artA = artData[o + 3];
      const garmentA = alpha[i];
      if (artA < 6 || garmentA === 0) continue;

      const rawL = lum[i];
      const normL = Math.max(0.15, Math.min(1.25, rawL / normBase));
      const clothShade = isCeramic ? 0.84 + 0.2 * normL : 0.62 + 0.42 * normL;
      const specBoost =
        isCeramic && rawL > 0.85 ? Math.pow((rawL - 0.85) / 0.15, 1.7) * 115 : 0;

      const ar = Math.min(255, artData[o] * clothShade * moodR + specBoost);
      const ag = Math.min(255, artData[o + 1] * clothShade * moodG + specBoost);
      const ab = Math.min(255, artData[o + 2] * clothShade * moodB + specBoost);

      const blend = (artA / 255) * (isCeramic ? 0.96 : 0.92);
      const inv = 1 - blend;

      dst[o] = Math.round(dst[o] * inv + ar * blend);
      dst[o + 1] = Math.round(dst[o + 1] * inv + ag * blend);
      dst[o + 2] = Math.round(dst[o + 2] * inv + ab * blend);
    }

    ctx.putImageData(baseImg, 0, 0);
  }

  return targetCanvas.toDataURL('image/png');
}

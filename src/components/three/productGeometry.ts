import * as THREE from 'three';

export interface CottonTextureBundle {
  weaveAlbedo: THREE.CanvasTexture;
  weaveNormal: THREE.CanvasTexture;
  ribNormal: THREE.CanvasTexture;
  glazeNormal: THREE.CanvasTexture;
  neckLabel: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates high-definition procedural PBR textures for combed cotton jersey knit,
 * 1x1 ribbed collar/cuff knit, glossy ceramic micro-glaze, woven neck label,
 * and soft grounded studio contact shadow.
 */
export function createStudioTextures(maxAnisotropy: number): CottonTextureBundle {
  // 1. Combed Cotton Jersey Knit Albedo (neutral bright weave so any garment color tints richly)
  const albedoSize = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = albedoSize;
  albedoCanvas.height = albedoSize;
  const aCtx = albedoCanvas.getContext('2d')!;
  aCtx.fillStyle = '#f8f8f8';
  aCtx.fillRect(0, 0, albedoSize, albedoSize);

  const aImg = aCtx.getImageData(0, 0, albedoSize, albedoSize);
  const aData = aImg.data;
  for (let y = 0; y < albedoSize; y++) {
    for (let x = 0; x < albedoSize; x++) {
      // Interlock cotton V-loop knit wales & courses
      const col = x % 6;
      const row = y % 6;
      const wale = Math.sin((col / 6) * Math.PI * 2 + (row < 3 ? row * 0.55 : (6 - row) * 0.55));
      const yarnSlub =
        Math.sin(x * 0.11 + Math.sin(y * 0.065) * 1.9) * 0.45 +
        Math.cos(y * 0.17 - Math.cos(x * 0.085) * 1.3) * 0.45;
      const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const microFiber = (hash - Math.floor(hash) - 0.5) * 6.5;

      const shade = Math.max(
        232,
        Math.min(255, Math.round(246 + wale * 6.5 + yarnSlub * 3.5 + microFiber))
      );
      const idx = (y * albedoSize + x) * 4;
      aData[idx] = shade;
      aData[idx + 1] = shade;
      aData[idx + 2] = shade;
      aData[idx + 3] = 255;
    }
  }
  aCtx.putImageData(aImg, 0, 0);
  const weaveAlbedo = new THREE.CanvasTexture(albedoCanvas);
  weaveAlbedo.colorSpace = THREE.SRGBColorSpace;
  weaveAlbedo.wrapS = THREE.RepeatWrapping;
  weaveAlbedo.wrapT = THREE.RepeatWrapping;
  weaveAlbedo.repeat.set(11, 11);
  weaveAlbedo.anisotropy = maxAnisotropy;

  // 2. Combed Cotton Jersey Knit Normal Map
  const normSize = 512;
  const normCanvas = document.createElement('canvas');
  normCanvas.width = normSize;
  normCanvas.height = normSize;
  const nCtx = normCanvas.getContext('2d')!;
  const nImg = nCtx.createImageData(normSize, normSize);
  const nData = nImg.data;
  for (let y = 0; y < normSize; y++) {
    for (let x = 0; x < normSize; x++) {
      const u = (x / 5) * Math.PI * 2;
      const v = (y / 6) * Math.PI * 2;
      const chevron = Math.sin(u + Math.abs(Math.sin(v * 0.5)) * 1.5);
      const course = Math.cos(v);
      const subtleSlub = Math.sin(x * 0.049 + Math.sin(y * 0.025) * 1.4) * 0.22;

      const nx = Math.max(-1, Math.min(1, chevron * 0.38 + subtleSlub * 0.22));
      const ny = Math.max(-1, Math.min(1, course * 0.3));
      const idx = (y * normSize + x) * 4;
      nData[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      nData[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nData[idx + 2] = 244;
      nData[idx + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);
  const weaveNormal = new THREE.CanvasTexture(normCanvas);
  weaveNormal.wrapS = THREE.RepeatWrapping;
  weaveNormal.wrapT = THREE.RepeatWrapping;
  weaveNormal.repeat.set(13, 13);
  weaveNormal.anisotropy = maxAnisotropy;

  // 3. 1x1 Rib-Knit Collar / Cuff Normal Map (crisp vertical ribbing)
  const ribSize = 256;
  const ribCanvas = document.createElement('canvas');
  ribCanvas.width = ribSize;
  ribCanvas.height = ribSize;
  const rCtx = ribCanvas.getContext('2d')!;
  const rImg = rCtx.createImageData(ribSize, ribSize);
  const rData = rImg.data;
  for (let y = 0; y < ribSize; y++) {
    for (let x = 0; x < ribSize; x++) {
      const rib = Math.cos((x / 7) * Math.PI * 2);
      const course = Math.sin((y / 3.5) * Math.PI * 2) * 0.22;
      const idx = (y * ribSize + x) * 4;
      rData[idx] = Math.round((rib * 0.52 + 0.5) * 255);
      rData[idx + 1] = Math.round((course * 0.32 + 0.5) * 255);
      rData[idx + 2] = 235;
      rData[idx + 3] = 255;
    }
  }
  rCtx.putImageData(rImg, 0, 0);
  const ribNormal = new THREE.CanvasTexture(ribCanvas);
  ribNormal.wrapS = THREE.RepeatWrapping;
  ribNormal.wrapT = THREE.RepeatWrapping;
  ribNormal.repeat.set(22, 2);
  ribNormal.anisotropy = maxAnisotropy;

  // 4. Subtle Glazed Ceramic Micro-Surface Normal Map
  const glazeSize = 256;
  const glazeCanvas = document.createElement('canvas');
  glazeCanvas.width = glazeSize;
  glazeCanvas.height = glazeSize;
  const gCtx = glazeCanvas.getContext('2d')!;
  const gImg = gCtx.createImageData(glazeSize, glazeSize);
  const gData = gImg.data;
  for (let y = 0; y < glazeSize; y++) {
    for (let x = 0; x < glazeSize; x++) {
      const rippleX = Math.sin(x * 0.098 + Math.cos(y * 0.073) * 1.3) * 0.05;
      const rippleY = Math.cos(y * 0.147 + Math.sin(x * 0.049) * 1.1) * 0.045;
      const idx = (y * glazeSize + x) * 4;
      gData[idx] = Math.round((rippleX * 0.5 + 0.5) * 255);
      gData[idx + 1] = Math.round((rippleY * 0.5 + 0.5) * 255);
      gData[idx + 2] = 254;
      gData[idx + 3] = 255;
    }
  }
  gCtx.putImageData(gImg, 0, 0);
  const glazeNormal = new THREE.CanvasTexture(glazeCanvas);
  glazeNormal.wrapS = THREE.RepeatWrapping;
  glazeNormal.wrapT = THREE.RepeatWrapping;
  glazeNormal.repeat.set(3, 3);

  // 5. Woven Interior Collar Label Texture
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 256;
  labelCanvas.height = 128;
  const lCtx = labelCanvas.getContext('2d')!;
  lCtx.fillStyle = '#18181E';
  lCtx.fillRect(0, 0, 256, 128);
  lCtx.strokeStyle = 'rgba(255,255,255,0.22)';
  lCtx.lineWidth = 3;
  lCtx.strokeRect(10, 10, 236, 108);
  lCtx.fillStyle = '#F5F5F7';
  lCtx.font = '800 24px system-ui, sans-serif';
  lCtx.textAlign = 'center';
  lCtx.fillText('DESIGNDROP', 128, 54);
  lCtx.fillStyle = '#A78BFA';
  lCtx.font = '700 13px system-ui, sans-serif';
  lCtx.fillText('240 GSM · COMBED COTTON', 128, 82);
  lCtx.fillStyle = '#A1A1AA';
  lCtx.font = '600 12px system-ui, sans-serif';
  lCtx.fillText('SIZE M  ·  STUDIO CRAFT', 128, 104);
  const neckLabel = new THREE.CanvasTexture(labelCanvas);
  neckLabel.colorSpace = THREE.SRGBColorSpace;
  neckLabel.anisotropy = maxAnisotropy;

  // 6. Soft Studio Contact Shadow
  const shadowSize = 512;
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowSize;
  shadowCanvas.height = shadowSize;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(256, 256, 18, 256, 256, 246);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.44)');
  grad.addColorStop(0.42, 'rgba(0, 0, 0, 0.20)');
  grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.05)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, shadowSize, shadowSize);
  const contactShadow = new THREE.CanvasTexture(shadowCanvas);

  return {
    weaveAlbedo,
    weaveNormal,
    ribNormal,
    glazeNormal,
    neckLabel,
    contactShadow,
    dispose: () => {
      weaveAlbedo.dispose();
      weaveNormal.dispose();
      ribNormal.dispose();
      glazeNormal.dispose();
      neckLabel.dispose();
      contactShadow.dispose();
    },
  };
}

/**
 * Evaluates a point on our tailored heavyweight cotton T-shirt / Hoodie torso.
 * u in [0, 1] wraps around circumference:
 *   u = 0.00 -> Front center (+Z)
 *   u = 0.25 -> Right side (+X)
 *   u = 0.50 -> Back center (-Z)
 *   u = 0.75 -> Left side (-X)
 * v in [0, 1] rises from bottom hem (v=0) up over shoulders to crew-neck rim (v=1).
 */
export function evaluateTorsoPoint(
  u: number,
  v: number,
  isHoodie: boolean,
  target: THREE.Vector3
): THREE.Vector3 {
  const theta = u * Math.PI * 2;
  const s = Math.sin(theta); // -1 left, +1 right
  const c = Math.cos(theta); // +1 front, -1 back
  const frontMask = Math.max(0, c);
  const backMask = Math.max(0, -c);
  const sideMask = Math.abs(s);

  const widthScale = isHoodie ? 1.07 : 1.0;
  const depthScale = isHoodie ? 1.12 : 1.0;

  let rx: number;
  let rz: number;
  let y: number;

  if (v <= 0.81) {
    const t = v / 0.81; // 0..1 from hem to shoulder-armhole peak
    // Tailored heavyweight crewneck drape: clean straight-athletic silhouette
    const waistContour = -0.026 * Math.sin(t * Math.PI);
    const chestBuild = 0.105 * Math.pow(t, 1.55);
    const hemTaper = isHoodie ? -0.052 * Math.pow(1 - t, 3) : 0.014 * Math.pow(1 - t, 2);
    rx = (0.648 + waistContour + chestBuild + hemTaper) * widthScale;

    // Anatomical front-to-back depth (full sculpted chest, natural upper-back curve, clean waist)
    const baseDepth = 0.268 + 0.044 * Math.sin(t * Math.PI * 0.9);
    const chestContour =
      0.072 * Math.pow(frontMask, 1.55) * Math.exp(-Math.pow((t - 0.72) / 0.27, 2));
    const upperBackContour =
      0.044 * Math.pow(backMask, 1.5) * Math.exp(-Math.pow((t - 0.79) / 0.25, 2));
    const lowerBackHollow =
      -0.026 * Math.pow(backMask, 1.8) * Math.exp(-Math.pow((t - 0.28) / 0.22, 2));
    const torsoSoftness =
      0.015 * Math.pow(frontMask, 1.5) * Math.exp(-Math.pow((t - 0.24) / 0.24, 2));
    rz = (baseDepth + chestContour + upperBackContour + lowerBackHollow + torsoSoftness) * depthScale;

    y = -1.04 + t * 1.78; // -1.04 to +0.74
  } else {
    // Upper shoulder slope curving cleanly over the trapezius into the open crew-neck collar
    const st = (v - 0.81) / 0.19; // 0..1
    const smoothSt = st * st * (3 - 2 * st);

    const shoulderRx = 0.753 * widthScale;
    const collarRx = isHoodie ? 0.282 : 0.255;
    rx = THREE.MathUtils.lerp(shoulderRx, collarRx, Math.pow(smoothSt, 0.85));

    const shoulderRz =
      (0.288 + 0.048 * Math.pow(frontMask, 1.5) + 0.032 * Math.pow(backMask, 1.5)) * depthScale;
    const collarRz = isHoodie ? 0.236 : 0.208;
    rz = THREE.MathUtils.lerp(shoulderRz, collarRz, Math.pow(smoothSt, 0.9));

    // Tailored crewneck scoop: graceful front U-dip (+0.78), high structured back (+0.98)
    const collarY =
      0.946 - 0.162 * Math.pow(frontMask, 1.8) + 0.034 * Math.pow(backMask, 1.35);
    const shoulderCrown = 0.072 * Math.sin(smoothSt * Math.PI) * Math.pow(sideMask, 1.25);
    y = THREE.MathUtils.lerp(0.74, collarY, smoothSt) + shoulderCrown;
  }

  // Subtle squircle factor so the front chest & back look tailored and flat-pressed, not barrel-round
  const squircleBoost = 1 + 0.072 * Math.pow(Math.sin(2 * theta), 2);
  let x = s * rx * squircleBoost;
  let z = c * rz * squircleBoost;

  // Natural gravity cloth draping folds (gentle vertical soft waves near bottom hem, clean pressed chest)
  const printQuietMask =
    1 -
    0.78 *
      Math.exp(-Math.pow((v - 0.56) / 0.23, 2)) *
      (Math.pow(frontMask, 2) + Math.pow(backMask, 2));
  const hemWeight = Math.pow(1 - Math.min(1, v / 0.86), 1.45);
  const drapeFold =
    (Math.sin(theta * 5 + 0.6) * 0.015 +
      Math.cos(theta * 3 - 0.85) * 0.011 +
      Math.sin(theta * 8 + v * 4.0) * 0.004) *
    hemWeight *
    printQuietMask;

  // Subtle soft tension creases near underarm side seams
  const armholeFold =
    0.009 *
    Math.sin(v * 22 + s * 2.8) *
    Math.pow(sideMask, 2.3) *
    Math.exp(-Math.pow((v - 0.65) / 0.13, 2));

  const radialOffset = drapeFold + armholeFold;
  x += s * radialOffset;
  z += c * radialOffset;

  // Crisp subtle hem wave
  const hemWave = Math.sin(theta * 4 + 0.35) * 0.009 * Math.pow(1 - Math.min(1, v * 4.2), 2);
  y += hemWave;

  target.set(x, y, z);
  return target;
}

/**
 * Evaluates surface point and outward unit normal on the torso for crisp seams & decals.
 */
function evaluateTorsoPointAndNormal(
  u: number,
  v: number,
  isHoodie: boolean,
  outPos: THREE.Vector3,
  outNorm: THREE.Vector3
): void {
  const pu = new THREE.Vector3();
  const pv = new THREE.Vector3();
  evaluateTorsoPoint(u, v, isHoodie, outPos);
  evaluateTorsoPoint((u + 0.002) % 1, v, isHoodie, pu);
  evaluateTorsoPoint(u, Math.min(0.999, v + 0.002), isHoodie, pv);
  pu.sub(outPos);
  pv.sub(outPos);
  outNorm.crossVectors(pu, pv).normalize();
}

/**
 * Builds the main sculpted cotton torso mesh with tailored vertex-color ambient occlusion
 * along underarms, side seams, collar base, and hem folds.
 */
function buildSculptedTorsoGeometry(isHoodie: boolean): THREE.BufferGeometry {
  const segU = 84;
  const segV = 54;
  const cols = segU + 1;
  const rows = segV + 1;

  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const colors = new Float32Array(rows * cols * 3);
  const indices: number[] = [];

  const pt = new THREE.Vector3();

  for (let iv = 0; iv <= segV; iv++) {
    const v = iv / segV;
    for (let iu = 0; iu <= segU; iu++) {
      const u = iu / segU;
      evaluateTorsoPoint(u, v, isHoodie, pt);

      const idx = iv * cols + iu;
      positions[idx * 3] = pt.x;
      positions[idx * 3 + 1] = pt.y;
      positions[idx * 3 + 2] = pt.z;

      uvs[idx * 2] = u * 2.0;
      uvs[idx * 2 + 1] = v * 1.35;

      const theta = u * Math.PI * 2;
      const sideFactor = Math.abs(Math.sin(theta));
      const underarmAO =
        0.10 *
        Math.pow(sideFactor, 2.5) *
        Math.exp(-Math.pow((v - 0.67) / 0.14, 2));
      const collarEdgeAO = 0.08 * Math.pow(Math.max(0, (v - 0.91) / 0.09), 2);
      const sideSeamAO = 0.03 * Math.pow(sideFactor, 12) * (1 - v * 0.4);
      const foldShade =
        0.025 * Math.sin(theta * 5 + 0.6) * Math.pow(1 - Math.min(1, v / 0.85), 1.45);
      const ao = Math.max(
        0.82,
        Math.min(1.0, 0.995 - underarmAO - collarEdgeAO - sideSeamAO - foldShade)
      );

      colors[idx * 3] = ao;
      colors[idx * 3 + 1] = ao;
      colors[idx * 3 + 2] = ao;
    }
  }

  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * cols + iu;
      const b = iv * cols + (iu + 1);
      const c = (iv + 1) * cols + iu;
      const d = (iv + 1) * cols + (iu + 1);
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds the hollow interior lining of the upper torso & collar so inspecting from above
 * reveals realistic cloth depth, back-neck taping, and woven garment label.
 */
function buildInnerLiningGeometry(isHoodie: boolean): THREE.BufferGeometry {
  const segU = 64;
  const segV = 18;
  const cols = segU + 1;
  const rows = segV + 1;

  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const indices: number[] = [];
  const pt = new THREE.Vector3();

  for (let iv = 0; iv <= segV; iv++) {
    const t = iv / segV;
    const v = 0.54 + t * 0.46;
    for (let iu = 0; iu <= segU; iu++) {
      const u = iu / segU;
      evaluateTorsoPoint(u, v, isHoodie, pt);
      pt.x *= 0.962;
      pt.z *= 0.935;
      pt.y -= 0.008;

      const idx = iv * cols + iu;
      positions[idx * 3] = pt.x;
      positions[idx * 3 + 1] = pt.y;
      positions[idx * 3 + 2] = pt.z;
      uvs[idx * 2] = u;
      uvs[idx * 2 + 1] = t;
    }
  }

  // Reversed winding so normals point INWARD (visible when peering into collar)
  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * cols + iu;
      const b = iv * cols + (iu + 1);
      const c = (iv + 1) * cols + iu;
      const d = (iv + 1) * cols + (iu + 1);
      indices.push(a, d, b);
      indices.push(a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds the sculpted 1x1 ribbed crew-neck collar band conforming cleanly to the scooped neckline.
 */
function buildRibbedCollarGeometry(isHoodie: boolean): THREE.BufferGeometry {
  const curvePts: THREE.Vector3[] = [];
  const samples = 56;
  for (let i = 0; i < samples; i++) {
    const u = i / samples;
    const p = evaluateTorsoPoint(u, 0.996, isHoodie, new THREE.Vector3());
    p.y += 0.015;
    curvePts.push(p);
  }
  const curve = new THREE.CatmullRomCurve3(curvePts, true, 'catmullrom', 0.5);
  const tubeGeo = new THREE.TubeGeometry(curve, 80, isHoodie ? 0.044 : 0.038, 18, true);

  // Subtle vertical band flattening so the collar looks like real folded 2.2cm rib-knit
  const pos = tubeGeo.attributes.position;
  const vert = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    vert.fromBufferAttribute(pos, i);
    pos.setXYZ(i, vert.x * 0.985, vert.y + 0.004, vert.z * 0.985);
  }
  tubeGeo.computeVertexNormals();
  return tubeGeo;
}

/**
 * Builds a tailored fine double-needle coverstitch seam loop around the torso at a given v height
 * (used for collar topstitching and twin-needle hem finishing).
 */
function buildTorsoStitchRingGeometry(
  v: number,
  radius: number,
  outwardOffset: number,
  isHoodie: boolean
): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  const samples = 64;
  const pos = new THREE.Vector3();
  const norm = new THREE.Vector3();
  for (let i = 0; i < samples; i++) {
    const u = i / samples;
    evaluateTorsoPointAndNormal(u, v, isHoodie, pos, norm);
    pts.push(pos.clone().addScaledVector(norm, outwardOffset));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  return new THREE.TubeGeometry(curve, 72, radius, 8, true);
}

/**
 * Builds tailored top-of-shoulder seam lines running from the collar edge to the armhole cap.
 */
function buildShoulderSeamGeometry(side: -1 | 1, isHoodie: boolean): THREE.BufferGeometry {
  const u = side === 1 ? 0.25 : 0.75;
  const pts: THREE.Vector3[] = [];
  const pos = new THREE.Vector3();
  const norm = new THREE.Vector3();
  for (let i = 0; i <= 14; i++) {
    const v = THREE.MathUtils.lerp(0.815, 0.985, i / 14);
    evaluateTorsoPointAndNormal(u, v, isHoodie, pos, norm);
    pts.push(pos.clone().addScaledVector(norm, 0.0045));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, 18, 0.0055, 8, false);
}

/**
 * Builds interior cotton twill back-neck reinforcement tape along the back collar inside.
 */
function buildBackNeckTapeGeometry(isHoodie: boolean): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  const samples = 24;
  for (let i = 0; i <= samples; i++) {
    // Spans across the back neckline from right shoulder (u=0.28) to left shoulder (u=0.72)
    const u = THREE.MathUtils.lerp(0.27, 0.73, i / samples);
    const p = evaluateTorsoPoint(u, 0.96, isHoodie, new THREE.Vector3());
    p.x *= 0.952;
    p.z *= 0.925;
    pts.push(p);
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, 28, 0.011, 8, false);
}

/**
 * Builds a tailored bottom hem fold / hoodie ribbed waistband following the exact torso hem.
 */
function buildHemBandGeometry(isHoodie: boolean): THREE.BufferGeometry {
  const segU = 72;
  const segV = 8;
  const cols = segU + 1;
  const rows = segV + 1;
  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const indices: number[] = [];
  const pt = new THREE.Vector3();

  const bandHeight = isHoodie ? 0.15 : 0.052;
  const outward = isHoodie ? 1.011 : 1.007;

  for (let iv = 0; iv <= segV; iv++) {
    const t = iv / segV;
    const v = t * (isHoodie ? 0.08 : 0.032);
    for (let iu = 0; iu <= segU; iu++) {
      const u = iu / segU;
      evaluateTorsoPoint(u, v, isHoodie, pt);
      const tuck = t === 0 ? 0.955 : outward;
      const idx = iv * cols + iu;
      positions[idx * 3] = pt.x * tuck;
      positions[idx * 3 + 1] = pt.y - (1 - t) * (bandHeight * 0.34);
      positions[idx * 3 + 2] = pt.z * tuck;
      uvs[idx * 2] = u * 4;
      uvs[idx * 2 + 1] = t;
    }
  }

  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * cols + iu;
      const b = iv * cols + (iu + 1);
      const c = (iv + 1) * cols + iu;
      const d = (iv + 1) * cols + (iu + 1);
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds an organically draped, hollow-cuffed sleeve lofted along a natural shoulder-to-arm curve,
 * plus returns a tailored double-needle sleeve cuff stitch ring and armhole shoulder seam ring.
 */
function buildDrapedSleeveAssembly(
  side: -1 | 1,
  isHoodie: boolean
): {
  sleeveGeo: THREE.BufferGeometry;
  armholeSeamGeo: THREE.BufferGeometry;
  cuffStitchGeo: THREE.BufferGeometry;
} {
  const curve = isHoodie
    ? new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.56, 0.70, -0.015),
        new THREE.Vector3(side * 0.84, 0.59, 0.01),
        new THREE.Vector3(side * 1.03, 0.21, 0.055),
        new THREE.Vector3(side * 1.11, -0.27, 0.115),
        new THREE.Vector3(side * 1.13, -0.74, 0.165),
      ])
    : new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.54, 0.71, -0.01),
        new THREE.Vector3(side * 0.78, 0.64, 0.005),
        new THREE.Vector3(side * 0.955, 0.46, 0.024),
        new THREE.Vector3(side * 1.065, 0.245, 0.042),
      ]);

  const segT = isHoodie ? 34 : 26;
  const segR = 36;
  const cuffCurlRings = 3;
  const totalT = segT + cuffCurlRings;

  const cols = segR + 1;
  const rows = totalT + 1;
  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const colors = new Float32Array(rows * cols * 3);
  const indices: number[] = [];

  const frames = curve.computeFrenetFrames(segT, false);
  const upRef = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const center = new THREE.Vector3();

  const armholePts: THREE.Vector3[] = [];
  const cuffPts: THREE.Vector3[] = [];
  const armholeRingIdx = Math.round(segT * 0.26);
  const cuffStitchIdx = segT - 2;

  for (let it = 0; it <= totalT; it++) {
    const isInnerCuff = it > segT;
    const rawT = isInnerCuff ? 1.0 - (it - segT) * 0.055 : it / segT;
    const t = Math.max(0, Math.min(1, rawT));

    curve.getPointAt(t, center);
    curve.getTangentAt(t, tangent).normalize();

    binormal.crossVectors(tangent, upRef).normalize();
    if (binormal.lengthSq() < 0.001) {
      binormal.copy(frames.binormals[Math.min(it, segT)]);
    }
    normal.crossVectors(binormal, tangent).normalize();

    // Tailored armhole flare tapering smoothly to a crisp relaxed sleeve opening
    const baseRadV = isHoodie
      ? THREE.MathUtils.lerp(0.285, 0.145, Math.pow(t, 0.85))
      : THREE.MathUtils.lerp(0.272, 0.194, Math.pow(t, 0.78));
    const baseRadH = isHoodie
      ? THREE.MathUtils.lerp(0.245, 0.135, Math.pow(t, 0.85))
      : THREE.MathUtils.lerp(0.232, 0.175, Math.pow(t, 0.78));

    const innerScale = isInnerCuff ? 0.90 - (it - segT) * 0.04 : 1.0;

    for (let ir = 0; ir <= segR; ir++) {
      const phi = (ir / segR) * Math.PI * 2;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);

      const fold = isInnerCuff
        ? 0
        : (Math.sin(phi * 4 + t * 5) * 0.0075 + Math.cos(phi * 2 - t * 3) * 0.005) *
          Math.sin(t * Math.PI);

      const rv = (baseRadV + fold) * innerScale;
      const rh = (baseRadH + fold) * innerScale;

      const px = center.x + normal.x * (cosP * rv) + binormal.x * (sinP * rh);
      const py = center.y + normal.y * (cosP * rv) + binormal.y * (sinP * rh);
      const pz = center.z + normal.z * (cosP * rv) + binormal.z * (sinP * rh);

      if (ir < segR) {
        if (it === armholeRingIdx) {
          armholePts.push(
            new THREE.Vector3(
              px + normal.x * cosP * 0.005 + binormal.x * sinP * 0.005,
              py + normal.y * cosP * 0.005 + binormal.y * sinP * 0.005,
              pz + normal.z * cosP * 0.005 + binormal.z * sinP * 0.005
            )
          );
        }
        if (it === cuffStitchIdx) {
          cuffPts.push(
            new THREE.Vector3(
              px + normal.x * cosP * 0.0045 + binormal.x * sinP * 0.0045,
              py + normal.y * cosP * 0.0045 + binormal.y * sinP * 0.0045,
              pz + normal.z * cosP * 0.0045 + binormal.z * sinP * 0.0045
            )
          );
        }
      }

      const idx = it * cols + ir;
      positions[idx * 3] = px;
      positions[idx * 3 + 1] = py;
      positions[idx * 3 + 2] = pz;

      uvs[idx * 2] = ir / segR;
      uvs[idx * 2 + 1] = t;

      const underarmShadow = Math.max(0, -cosP) * 0.11 * (1 - t * 0.45);
      const ao = isInnerCuff ? 0.40 : Math.max(0.84, 0.995 - underarmShadow);
      colors[idx * 3] = ao;
      colors[idx * 3 + 1] = ao;
      colors[idx * 3 + 2] = ao;
    }
  }

  // Verified outward winding: normal = binormal x tangent => (dP/dphi) x (dP/dt) = +normal
  for (let it = 0; it < totalT; it++) {
    for (let ir = 0; ir < segR; ir++) {
      const a = it * cols + ir;
      const b = it * cols + (ir + 1);
      const c = (it + 1) * cols + ir;
      const d = (it + 1) * cols + (ir + 1);
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const sleeveGeo = new THREE.BufferGeometry();
  sleeveGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  sleeveGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  sleeveGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  sleeveGeo.setIndex(indices);
  sleeveGeo.computeVertexNormals();

  const armholeCurve = new THREE.CatmullRomCurve3(armholePts, true, 'catmullrom', 0.5);
  const armholeSeamGeo = new THREE.TubeGeometry(armholeCurve, 44, 0.006, 8, true);

  const cuffCurve = new THREE.CatmullRomCurve3(cuffPts, true, 'catmullrom', 0.5);
  const cuffStitchGeo = new THREE.TubeGeometry(cuffCurve, 44, 0.0045, 8, true);

  return { sleeveGeo, armholeSeamGeo, cuffStitchGeo };
}

/**
 * Builds a surface-conforming curved artwork decal geometry that wraps seamlessly
 * across the front chest or back of the sculpted T-shirt/Hoodie.
 */
function buildConformingShirtDecalGeometry(
  printArea: 'front' | 'back' | 'wrap' | 'none',
  isHoodie: boolean
): THREE.BufferGeometry {
  const segX = 28;
  const segY = 28;
  const cols = segX + 1;
  const rows = segY + 1;

  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const indices: number[] = [];

  const isBack = printArea === 'back';
  const centerU = isBack ? 0.5 : 0.0;
  const halfSpanU = isHoodie ? 0.112 : 0.122;
  const vMin = isHoodie ? 0.40 : 0.31;
  const vMax = isHoodie ? 0.78 : 0.76;

  const p = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let iy = 0; iy <= segY; iy++) {
    const ty = iy / segY;
    const v = THREE.MathUtils.lerp(vMin, vMax, ty);

    for (let ix = 0; ix <= segX; ix++) {
      const tx = ix / segX;
      const rawU = centerU + THREE.MathUtils.lerp(-halfSpanU, halfSpanU, tx);
      const u = ((rawU % 1) + 1) % 1;

      evaluateTorsoPointAndNormal(u, v, isHoodie, p, n);
      p.addScaledVector(n, 0.0065);

      const idx = iy * cols + ix;
      positions[idx * 3] = p.x;
      positions[idx * 3 + 1] = p.y;
      positions[idx * 3 + 2] = p.z;

      uvs[idx * 2] = tx;
      uvs[idx * 2 + 1] = ty;
    }
  }

  for (let iy = 0; iy < segY; iy++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iy * cols + ix;
      const b = iy * cols + (ix + 1);
      const c = (iy + 1) * cols + ix;
      const d = (iy + 1) * cols + (ix + 1);
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a realistic contoured hoodie front kangaroo pocket conforming to the torso curve.
 */
function buildKangarooPocketGeometry(): THREE.BufferGeometry {
  const segX = 20;
  const segY = 12;
  const cols = segX + 1;
  const rows = segY + 1;
  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const indices: number[] = [];

  const p = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let iy = 0; iy <= segY; iy++) {
    const ty = iy / segY;
    const v = THREE.MathUtils.lerp(0.11, 0.34, ty);
    const halfSpanU = THREE.MathUtils.lerp(0.115, 0.075, ty);

    for (let ix = 0; ix <= segX; ix++) {
      const tx = ix / segX;
      const u = ((THREE.MathUtils.lerp(-halfSpanU, halfSpanU, tx) % 1) + 1) % 1;

      evaluateTorsoPointAndNormal(u, v, true, p, n);
      const edgeBulge = Math.sin(tx * Math.PI) * Math.sin(ty * Math.PI) * 0.026 + 0.012;
      p.addScaledVector(n, edgeBulge);

      const idx = iy * cols + ix;
      positions[idx * 3] = p.x;
      positions[idx * 3 + 1] = p.y;
      positions[idx * 3 + 2] = p.z;
      uvs[idx * 2] = tx;
      uvs[idx * 2 + 1] = ty;
    }
  }

  for (let iy = 0; iy < segY; iy++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iy * cols + ix;
      const b = iy * cols + (ix + 1);
      const c = (iy + 1) * cols + ix;
      const d = (iy + 1) * cols + (ix + 1);
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a flagship-tailored 3D T-Shirt or Hoodie assembly with twin-needle coverstitching,
 * 1x1 rib collar, interior back-neck twill tape, woven brand label, and draped hollow sleeves.
 */
export function buildRealisticShirtGroup(
  colorHex: string,
  isHoodie: boolean,
  fabricMat: THREE.MeshPhysicalMaterial,
  ribMat: THREE.MeshPhysicalMaterial,
  seamMat: THREE.MeshStandardMaterial,
  innerMat: THREE.MeshStandardMaterial,
  labelMat: THREE.MeshStandardMaterial,
  decalMat: THREE.MeshStandardMaterial,
  printArea: 'front' | 'back' | 'wrap' | 'none'
): { group: THREE.Group; decalMesh: THREE.Mesh; geometries: THREE.BufferGeometry[] } {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];

  fabricMat.color.set(colorHex);
  const col = new THREE.Color(colorHex);
  const lum = 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;
  ribMat.color.copy(col).multiplyScalar(lum < 0.12 ? 1.14 : 0.95);
  seamMat.color.copy(col).multiplyScalar(lum < 0.14 ? 1.32 : 0.84);
  innerMat.color.copy(col).multiplyScalar(0.54);

  // 1. Main sculpted combed-cotton torso
  const torsoGeo = buildSculptedTorsoGeometry(isHoodie);
  geometries.push(torsoGeo);
  const torsoMesh = new THREE.Mesh(torsoGeo, fabricMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  // 2. Hollow interior neck lining & cotton twill back-neck tape
  const innerGeo = buildInnerLiningGeometry(isHoodie);
  const tapeGeo = buildBackNeckTapeGeometry(isHoodie);
  geometries.push(innerGeo, tapeGeo);
  group.add(new THREE.Mesh(innerGeo, innerMat));
  group.add(new THREE.Mesh(tapeGeo, seamMat));

  // 3. Woven interior collar size label
  const labelGeo = new THREE.PlaneGeometry(0.165, 0.082);
  geometries.push(labelGeo);
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.set(0, 0.865, -0.18);
  labelMesh.rotation.x = 0.16;
  group.add(labelMesh);

  // 4. 1x1 Ribbed crew-neck collar + twin-needle neckline coverstitching
  const collarGeo = buildRibbedCollarGeometry(isHoodie);
  const collarStitchGeo = buildTorsoStitchRingGeometry(0.955, 0.0042, 0.005, isHoodie);
  geometries.push(collarGeo, collarStitchGeo);
  const collarMesh = new THREE.Mesh(collarGeo, ribMat);
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  group.add(collarMesh);
  group.add(new THREE.Mesh(collarStitchGeo, seamMat));

  // 5. Tailored top shoulder seams (left & right)
  const leftShoulderSeam = buildShoulderSeamGeometry(-1, isHoodie);
  const rightShoulderSeam = buildShoulderSeamGeometry(1, isHoodie);
  geometries.push(leftShoulderSeam, rightShoulderSeam);
  group.add(new THREE.Mesh(leftShoulderSeam, seamMat));
  group.add(new THREE.Mesh(rightShoulderSeam, seamMat));

  // 6. Left & Right anatomically draped hollow sleeves + armhole seams + cuff coverstitching
  const leftSleeve = buildDrapedSleeveAssembly(-1, isHoodie);
  const rightSleeve = buildDrapedSleeveAssembly(1, isHoodie);
  geometries.push(
    leftSleeve.sleeveGeo,
    leftSleeve.armholeSeamGeo,
    leftSleeve.cuffStitchGeo,
    rightSleeve.sleeveGeo,
    rightSleeve.armholeSeamGeo,
    rightSleeve.cuffStitchGeo
  );

  const leftSleeveMesh = new THREE.Mesh(leftSleeve.sleeveGeo, fabricMat);
  leftSleeveMesh.castShadow = true;
  leftSleeveMesh.receiveShadow = true;
  group.add(leftSleeveMesh);
  group.add(new THREE.Mesh(leftSleeve.armholeSeamGeo, seamMat));
  group.add(new THREE.Mesh(leftSleeve.cuffStitchGeo, seamMat));

  const rightSleeveMesh = new THREE.Mesh(rightSleeve.sleeveGeo, fabricMat);
  rightSleeveMesh.castShadow = true;
  rightSleeveMesh.receiveShadow = true;
  group.add(rightSleeveMesh);
  group.add(new THREE.Mesh(rightSleeve.armholeSeamGeo, seamMat));
  group.add(new THREE.Mesh(rightSleeve.cuffStitchGeo, seamMat));

  // 7. Tailored bottom hem fold + twin-needle coverstitch rings
  const hemGeo = buildHemBandGeometry(isHoodie);
  const hemStitch1 = buildTorsoStitchRingGeometry(isHoodie ? 0.082 : 0.036, 0.004, 0.0055, isHoodie);
  const hemStitch2 = buildTorsoStitchRingGeometry(isHoodie ? 0.072 : 0.025, 0.0036, 0.0055, isHoodie);
  geometries.push(hemGeo, hemStitch1, hemStitch2);
  const hemMesh = new THREE.Mesh(hemGeo, ribMat);
  hemMesh.castShadow = true;
  hemMesh.receiveShadow = true;
  group.add(hemMesh);
  group.add(new THREE.Mesh(hemStitch1, seamMat));
  group.add(new THREE.Mesh(hemStitch2, seamMat));

  // 8. Hoodie-specific draped hood, kangaroo pocket, and cotton drawstrings
  if (isHoodie) {
    const hoodGeo = new THREE.SphereGeometry(0.41, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.62);
    geometries.push(hoodGeo);
    const hoodMesh = new THREE.Mesh(hoodGeo, fabricMat);
    hoodMesh.position.set(0, 0.96, -0.19);
    hoodMesh.scale.set(0.95, 0.86, 1.08);
    hoodMesh.rotation.x = -0.68;
    hoodMesh.castShadow = true;
    group.add(hoodMesh);

    const pocketGeo = buildKangarooPocketGeometry();
    geometries.push(pocketGeo);
    const pocketMesh = new THREE.Mesh(pocketGeo, fabricMat);
    pocketMesh.castShadow = true;
    pocketMesh.receiveShadow = true;
    group.add(pocketMesh);

    const leftStringCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.085, 0.78, 0.255),
      new THREE.Vector3(-0.10, 0.62, 0.355),
      new THREE.Vector3(-0.095, 0.44, 0.37),
    ]);
    const rightStringCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.085, 0.78, 0.255),
      new THREE.Vector3(0.10, 0.62, 0.355),
      new THREE.Vector3(0.095, 0.44, 0.37),
    ]);
    const lsGeo = new THREE.TubeGeometry(leftStringCurve, 16, 0.013, 8, false);
    const rsGeo = new THREE.TubeGeometry(rightStringCurve, 16, 0.013, 8, false);
    geometries.push(lsGeo, rsGeo);
    group.add(new THREE.Mesh(lsGeo, seamMat), new THREE.Mesh(rsGeo, seamMat));
  }

  // 9. Surface-conforming curved artwork print layer
  const decalGeo = buildConformingShirtDecalGeometry(printArea, isHoodie);
  geometries.push(decalGeo);
  const decalMesh = new THREE.Mesh(decalGeo, decalMat);
  decalMesh.visible = printArea !== 'none';
  group.add(decalMesh);

  return { group, decalMesh, geometries };
}

/**
 * Builds an ergonomic ceramic C-handle with flattened oval grip cross-section
 * and organically flared attachment fillets where it fuses into the mug body.
 */
function buildErgonomicMugHandleGeometry(): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.575, 0.47, 0),
    new THREE.Vector3(0.86, 0.49, 0),
    new THREE.Vector3(1.03, 0.24, 0),
    new THREE.Vector3(1.03, -0.18, 0),
    new THREE.Vector3(0.86, -0.46, 0),
    new THREE.Vector3(0.575, -0.45, 0),
  ]);

  const segT = 44;
  const segR = 24;
  const cols = segR + 1;
  const rows = segT + 1;

  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const indices: number[] = [];

  const zAxis = new THREE.Vector3(0, 0, 1);
  const tangent = new THREE.Vector3();
  const inPlaneNormal = new THREE.Vector3();
  const center = new THREE.Vector3();

  for (let it = 0; it <= segT; it++) {
    const t = it / segT;
    curve.getPointAt(t, center);
    curve.getTangentAt(t, tangent).normalize();
    inPlaneNormal.crossVectors(zAxis, tangent).normalize();

    const topFlare = Math.exp(-Math.pow(t / 0.11, 2)) * 0.48;
    const botFlare = Math.exp(-Math.pow((1 - t) / 0.11, 2)) * 0.48;
    const flare = 1 + topFlare + botFlare;

    const rx = 0.056 * flare;
    const rz = 0.096 * (1 + (topFlare + botFlare) * 0.65);

    for (let ir = 0; ir <= segR; ir++) {
      const phi = (ir / segR) * Math.PI * 2;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);

      const sq = 1 + 0.07 * Math.pow(Math.sin(2 * phi), 2);
      const px = center.x + inPlaneNormal.x * (cosP * rx * sq);
      const py = center.y + inPlaneNormal.y * (cosP * rx * sq);
      const pz = center.z + sinP * rz * sq;

      const idx = it * cols + ir;
      positions[idx * 3] = px;
      positions[idx * 3 + 1] = py;
      positions[idx * 3 + 2] = pz;
      uvs[idx * 2] = ir / segR;
      uvs[idx * 2 + 1] = t;
    }
  }

  for (let it = 0; it < segT; it++) {
    for (let ir = 0; ir < segR; ir++) {
      const a = it * cols + ir;
      const b = it * cols + (ir + 1);
      const c = (it + 1) * cols + ir;
      const d = (it + 1) * cols + (ir + 1);
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a studio-quality 11oz glazed ceramic mug with rounded drinking lip,
 * full glazed interior, recessed unglazed stoneware foot ring, ergonomic flared C-handle,
 * and glossy wrap-around sublimation print layer.
 */
export function buildRealisticMugGroup(
  colorHex: string,
  ceramicMat: THREE.MeshPhysicalMaterial,
  footMat: THREE.MeshStandardMaterial,
  decalMat: THREE.MeshPhysicalMaterial
): { group: THREE.Group; decalMesh: THREE.Mesh; geometries: THREE.BufferGeometry[] } {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  ceramicMat.color.set(colorHex);

  const mugProfile: THREE.Vector2[] = [
    new THREE.Vector2(0.0, -0.745),
    new THREE.Vector2(0.47, -0.745),
    new THREE.Vector2(0.495, -0.785),
    new THREE.Vector2(0.545, -0.785),
    new THREE.Vector2(0.575, -0.755),
    new THREE.Vector2(0.602, -0.70),
    new THREE.Vector2(0.610, -0.20),
    new THREE.Vector2(0.616, 0.35),
    new THREE.Vector2(0.620, 0.72),
    new THREE.Vector2(0.615, 0.765),
    new THREE.Vector2(0.596, 0.790),
    new THREE.Vector2(0.568, 0.790),
    new THREE.Vector2(0.548, 0.762),
    new THREE.Vector2(0.542, 0.68),
    new THREE.Vector2(0.532, -0.58),
    new THREE.Vector2(0.505, -0.64),
    new THREE.Vector2(0.44, -0.665),
    new THREE.Vector2(0.0, -0.670),
  ];

  const bodyGeo = new THREE.LatheGeometry(mugProfile, 96);
  geometries.push(bodyGeo);
  const bodyMesh = new THREE.Mesh(bodyGeo, ceramicMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  const footRingGeo = new THREE.RingGeometry(0.488, 0.552, 64);
  geometries.push(footRingGeo);
  const footRing = new THREE.Mesh(footRingGeo, footMat);
  footRing.rotation.x = Math.PI / 2;
  footRing.position.y = -0.786;
  group.add(footRing);

  const handleGeo = buildErgonomicMugHandleGeometry();
  geometries.push(handleGeo);
  const handleMesh = new THREE.Mesh(handleGeo, ceramicMat);
  handleMesh.castShadow = true;
  handleMesh.receiveShadow = true;
  group.add(handleMesh);

  const wrapGeo = new THREE.CylinderGeometry(
    0.6235,
    0.6095,
    1.18,
    72,
    1,
    true,
    -Math.PI * 0.68,
    Math.PI * 1.36
  );
  geometries.push(wrapGeo);
  const decalMesh = new THREE.Mesh(wrapGeo, decalMat);
  decalMesh.position.y = 0.01;
  decalMesh.rotation.y = Math.PI * 0.5;
  group.add(decalMesh);

  return { group, decalMesh, geometries };
}

/**
 * Builds a realistic curved-brim 6-panel cotton twill cap with arched solid visor,
 * top squatchee button, and curved front artwork decal.
 */
export function buildRealisticCapGroup(
  colorHex: string,
  fabricMat: THREE.MeshPhysicalMaterial,
  trimMat: THREE.MeshPhysicalMaterial,
  decalMat: THREE.MeshStandardMaterial
): { group: THREE.Group; decalMesh: THREE.Mesh; geometries: THREE.BufferGeometry[] } {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];

  fabricMat.color.set(colorHex);
  const col = new THREE.Color(colorHex);
  trimMat.color.copy(col).multiplyScalar(0.88);

  const crownGeo = new THREE.SphereGeometry(0.80, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.54);
  geometries.push(crownGeo);
  const crown = new THREE.Mesh(crownGeo, fabricMat);
  crown.position.y = -0.16;
  crown.scale.set(0.98, 0.90, 1.08);
  crown.castShadow = true;
  crown.receiveShadow = true;
  group.add(crown);

  const segX = 32;
  const segZ = 14;
  const cols = segX + 1;
  const rows = segZ + 1;
  const faceVerts = rows * cols;
  const bPos = new Float32Array(faceVerts * 2 * 3);
  const bUvs = new Float32Array(faceVerts * 2 * 2);
  const bIdx: number[] = [];

  for (let iz = 0; iz <= segZ; iz++) {
    const tz = iz / segZ;
    for (let ix = 0; ix <= segX; ix++) {
      const tx = ix / segX;
      const angle = THREE.MathUtils.lerp(-Math.PI * 0.44, Math.PI * 0.44, tx);
      const innerR = 0.78;
      const tipExtension = 0.62 * Math.pow(Math.cos(angle * 0.95), 0.75);
      const r = innerR + tz * tipExtension;

      const x = Math.sin(angle) * r * 0.98;
      const z = Math.cos(angle) * r * 1.04;
      const lateralArch = -0.16 * Math.pow(Math.sin(angle), 2) * (0.25 + 0.75 * tz);
      const forwardSlope = -0.14 * tz;
      const y = -0.18 + lateralArch + forwardSlope;

      const idxTop = iz * cols + ix;
      bPos[idxTop * 3] = x;
      bPos[idxTop * 3 + 1] = y;
      bPos[idxTop * 3 + 2] = z;
      bUvs[idxTop * 2] = tx;
      bUvs[idxTop * 2 + 1] = tz;

      const idxBot = faceVerts + idxTop;
      bPos[idxBot * 3] = x;
      bPos[idxBot * 3 + 1] = y - 0.022;
      bPos[idxBot * 3 + 2] = z;
      bUvs[idxBot * 2] = tx;
      bUvs[idxBot * 2 + 1] = tz;
    }
  }

  for (let iz = 0; iz < segZ; iz++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iz * cols + ix;
      const b = iz * cols + (ix + 1);
      const c = (iz + 1) * cols + ix;
      const d = (iz + 1) * cols + (ix + 1);
      bIdx.push(a, c, d);
      bIdx.push(a, d, b);
      const ab = faceVerts + a;
      const bb = faceVerts + b;
      const cb = faceVerts + c;
      const db = faceVerts + d;
      bIdx.push(ab, db, cb);
      bIdx.push(ab, bb, db);
    }
  }

  for (let ix = 0; ix < segX; ix++) {
    const t0 = segZ * cols + ix;
    const t1 = segZ * cols + (ix + 1);
    const b0 = faceVerts + t0;
    const b1 = faceVerts + t1;
    bIdx.push(t0, b0, b1);
    bIdx.push(t0, b1, t1);
  }

  const brimGeo = new THREE.BufferGeometry();
  brimGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  brimGeo.setAttribute('uv', new THREE.BufferAttribute(bUvs, 2));
  brimGeo.setIndex(bIdx);
  brimGeo.computeVertexNormals();
  geometries.push(brimGeo);
  const brimMesh = new THREE.Mesh(brimGeo, trimMat);
  brimMesh.castShadow = true;
  brimMesh.receiveShadow = true;
  group.add(brimMesh);

  const btnGeo = new THREE.SphereGeometry(0.072, 20, 14);
  geometries.push(btnGeo);
  const btn = new THREE.Mesh(btnGeo, trimMat);
  btn.position.set(0, 0.565, 0);
  btn.scale.set(1, 0.55, 1);
  group.add(btn);

  const decalGeo = new THREE.SphereGeometry(
    0.812,
    24,
    16,
    Math.PI * 0.34,
    Math.PI * 0.32,
    Math.PI * 0.24,
    Math.PI * 0.22
  );
  geometries.push(decalGeo);
  const decalMesh = new THREE.Mesh(decalGeo, decalMat);
  decalMesh.position.y = -0.16;
  decalMesh.scale.set(0.98, 0.90, 1.08);
  decalMesh.rotation.y = -Math.PI / 2;
  group.add(decalMesh);

  return { group, decalMesh, geometries };
}

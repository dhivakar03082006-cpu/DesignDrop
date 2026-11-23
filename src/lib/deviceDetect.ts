export interface DeviceCapabilities {
  webGLSupported: boolean;
  isSoftwareGl: boolean;
  isLowEndDevice: boolean;
  isOutdatedBrowser: boolean;
  prefersReducedMotion: boolean;
}

export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      webGLSupported: true,
      isSoftwareGl: false,
      isLowEndDevice: false,
      isOutdatedBrowser: false,
      prefersReducedMotion: false,
    };
  }

  let webGLSupported = false;
  let isSoftwareGl = false;

  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (gl) {
      webGLSupported = true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    webGLSupported = false;
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2;
  const lowCores = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2;
  const isLowEndDevice = lowMemory || lowCores;

  const ua = navigator.userAgent || '';
  const isIE = /MSIE|Trident/i.test(ua);
  const lacksModernApis =
    typeof Promise === 'undefined' ||
    typeof fetch === 'undefined' ||
    typeof window.CSS === 'undefined' ||
    !window.CSS.supports?.('display', 'grid');
  const isOutdatedBrowser = isIE || lacksModernApis;

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  return {
    webGLSupported,
    isSoftwareGl,
    isLowEndDevice,
    isOutdatedBrowser,
    prefersReducedMotion,
  };
}

import React from 'react';
import type { ProductType } from '../../types/index.ts';
import { PhotorealStudioViewer } from './PhotorealStudioViewer.tsx';

export type LightingMood = 'daylight' | 'violet' | 'sunset';

export interface Product3DViewerProps {
  productType: ProductType;
  colorHex: string;
  printArea?: 'front' | 'back' | 'wrap' | 'none';
  textureSourceUrl?: string | null;
  interactive?: boolean;
  heroMode?: boolean;
  showDualHero?: boolean;
  autoSpin?: boolean;
  lightingMood?: LightingMood;
  externalRotationY?: number;
  fallbackImageUrl?: string;
  className?: string;
  onCameraPreset?: 'front' | 'back' | 'side' | 'reset';
}

/**
 * Photorealistic 360° Product Viewer powered by multi-angle studio ghost-mannequin
 * photography with real-time garment dyeing and cloth-fold artwork projection.
 */
export const Product3DViewer: React.FC<Product3DViewerProps> = (props) => {
  return <PhotorealStudioViewer {...props} />;
};

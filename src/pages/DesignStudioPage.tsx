import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Canvas as FabricCanvas,
  FabricImage,
  IText,
  Path as FabricPath,
  Circle as FabricCircle,
  Rect as FabricRect,
  Triangle as FabricTriangle,
  Shadow,
  type FabricObject,
} from 'fabric';
import {
  Upload,
  Type,
  Smile,
  Layers,
  Undo2,
  Redo2,
  Save,
  Download,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  HelpCircle,
  Minus,
  Plus,
  Sparkles,
  RotateCw,
  Wand2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FolderOpen,
  Share2,
  Copy,
  Users,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore.ts';
import { useT } from '../hooks/useT.ts';
import { api } from '../lib/api.ts';
import { HelpTooltip } from '../components/HelpTooltip.tsx';
import { AnimatedNumber, useMotionEnabled } from '../components/MotionPrimitives.tsx';
import type { LightingMood } from '../components/three/Product3DViewer.tsx';
import type { ProductType, SavedDesign } from '../types/index.ts';

const Product3DViewer = lazy(() =>
  import('../components/three/Product3DViewer.tsx').then((m) => ({ default: m.Product3DViewer }))
);

const COLORS = [
  { name: 'Charcoal Black', hex: '#18181B' },
  { name: 'Warm Ivory', hex: '#F5F3EE' },
  { name: 'Electric Violet', hex: '#7C3AED' },
  { name: 'Coral Red', hex: '#FF5A5F' },
  { name: 'Slate Navy', hex: '#1E293B' },
  { name: 'Sage Green', hex: '#4B6B58' },
  { name: 'Pure White', hex: '#FFFFFF' },
];

const TEXT_COLORS = ['#FFFFFF', '#111116', '#7C3AED', '#FF5A5F', '#FACC15', '#10B981', '#38BDF8'];
const FONTS = ['Sora', 'DM Sans', 'Plus Jakarta Sans', 'Georgia', 'Courier New'];

interface StickerDef {
  id: string;
  label: string;
  color: string;
  kind: 'path' | 'circle' | 'triangle' | 'rect' | 'ring';
  pathData?: string;
}

const STICKERS: StickerDef[] = [
  {
    id: 'heart',
    label: 'Heart',
    color: '#FF5A5F',
    kind: 'path',
    pathData: 'M 27.2 7.5 C 21.8 1.5 11.5 2.1 6.8 8.9 C 2.1 15.7 3.8 25.1 10.6 31.1 L 27.2 46 L 43.8 31.1 C 50.6 25.1 52.3 15.7 47.6 8.9 C 42.9 2.1 32.6 1.5 27.2 7.5 Z',
  },
  {
    id: 'star',
    label: 'Star',
    color: '#FACC15',
    kind: 'path',
    pathData: 'M 25 2 L 31.5 17.5 L 48 19 L 35.5 30 L 39.2 46.5 L 25 38 L 10.8 46.5 L 14.5 30 L 2 19 L 18.5 17.5 Z',
  },
  {
    id: 'crown',
    label: 'Crown',
    color: '#F59E0B',
    kind: 'path',
    pathData: 'M 4 38 L 8 14 L 18 24 L 26 8 L 34 24 L 44 14 L 48 38 Z',
  },
  {
    id: 'bolt',
    label: 'Bolt',
    color: '#38BDF8',
    kind: 'path',
    pathData: 'M 28 2 L 10 26 L 24 26 L 20 48 L 40 22 L 26 22 Z',
  },
  {
    id: 'diamond',
    label: 'Diamond',
    color: '#A78BFA',
    kind: 'path',
    pathData: 'M 25 4 L 46 25 L 25 46 L 4 25 Z',
  },
  {
    id: 'trophy',
    label: 'Trophy',
    color: '#FBBF24',
    kind: 'path',
    pathData: 'M 14 8 H 38 V 22 C 38 29 32 34 26 34 C 20 34 14 29 14 22 Z M 22 34 H 30 V 42 H 22 Z M 16 42 H 36 V 46 H 16 Z',
  },
  {
    id: 'leaf',
    label: 'Leaf',
    color: '#10B981',
    kind: 'path',
    pathData: 'M 42 8 C 22 8 10 20 10 38 C 28 38 42 26 42 8 Z',
  },
  {
    id: 'coffee',
    label: 'Coffee',
    color: '#D97706',
    kind: 'path',
    pathData: 'M 10 16 H 38 V 36 C 38 41 34 44 24 44 C 14 44 10 41 10 36 Z M 38 20 H 45 V 30 H 38 Z',
  },
  {
    id: 'music',
    label: 'Music',
    color: '#EC4899',
    kind: 'path',
    pathData: 'M 20 8 V 36 A 6 6 0 1 1 16 30 V 14 L 38 10 V 32 A 6 6 0 1 1 34 26 V 6 Z',
  },
  {
    id: 'bubble',
    label: 'Bubble',
    color: '#60A5FA',
    kind: 'path',
    pathData: 'M 8 10 H 44 V 34 H 24 L 14 44 V 34 H 8 Z',
  },
  {
    id: 'ribbon',
    label: 'Banner',
    color: '#FF5A5F',
    kind: 'path',
    pathData: 'M 4 14 H 46 L 40 24 L 46 34 H 4 L 10 24 Z',
  },
  {
    id: 'circle',
    label: 'Sun Disc',
    color: '#7C3AED',
    kind: 'circle',
  },
  {
    id: 'triangle',
    label: 'Mountain',
    color: '#10B981',
    kind: 'triangle',
  },
  {
    id: 'badge',
    label: 'Frame Box',
    color: '#38BDF8',
    kind: 'rect',
  },
  {
    id: 'stamp',
    label: 'Seal Ring',
    color: '#F5F5F7',
    kind: 'ring',
  },
];

const STARTER_TEMPLATES = [
  { id: 'birthday', label: 'Birthday Gift', accent: '#FF5A5F' },
  { id: 'team', label: 'Team Jersey', accent: '#7C3AED' },
  { id: 'coffee', label: 'Morning Mug', accent: '#F59E0B' },
  { id: 'minimal', label: 'Clean Studio', accent: '#10B981' },
];

const TOUR_STEPS = [
  {
    title: '1. Pick your item & color',
    text: 'Choose a T-shirt, mug, hoodie, or cap, pick a color, and pick front or back.',
  },
  {
    title: '2. Add photos, text, or stickers',
    text: 'Try a 1-tap Starter Look, upload a photo, write custom text, or drop stickers.',
  },
  {
    title: '3. Move & resize with fingers or mouse',
    text: 'Drag anything inside the dotted box. Made a mistake? Tap Undo anytime.',
  },
  {
    title: '4. Check it in 3D with Studio Lights!',
    text: 'Turn the 3D view around, switch studio lighting, or turn on Auto-Spin 360°.',
  },
];

interface LayerInfo {
  index: number;
  label: string;
  type: string;
}

const PRODUCT_BASE_PRICE: Record<ProductType, number> = {
  tshirt: 599,
  mug: 349,
  hoodie: 1299,
  cap: 449,
};

export const DesignStudioPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const t = useT();
  const user = useAppStore((s) => s.user);
  const addToCart = useAppStore((s) => s.addToCart);
  const saveDesignLocal = useAppStore((s) => s.saveDesignLocal);
  const deleteDesignLocal = useAppStore((s) => s.deleteDesignLocal);
  const savedDesigns = useAppStore((s) => s.savedDesigns);
  const showToast = useAppStore((s) => s.showToast);
  const hasSeenStudioTour = useAppStore((s) => s.hasSeenStudioTour);
  const setHasSeenStudioTour = useAppStore((s) => s.setHasSeenStudioTour);

  const paramProd = searchParams.get('product');
  const initialProduct: ProductType =
    paramProd === 'mug' || paramProd === 'hoodie' || paramProd === 'cap' ? paramProd : 'tshirt';
  const initialColorHex =
    searchParams.get('color') || (initialProduct === 'mug' ? '#FFFFFF' : '#18181B');
  const initialColor =
    COLORS.find((c) => c.hex.toLowerCase() === initialColorHex.toLowerCase()) || COLORS[0];
  const loadDesignId = searchParams.get('designId');

  const [productType, setProductType] = useState<ProductType>(initialProduct);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [size, setSize] = useState(
    initialProduct === 'mug' ? '11 oz' : initialProduct === 'cap' ? 'One Size' : 'M'
  );
  const [printArea, setPrintArea] = useState<'front' | 'back' | 'wrap'>(
    initialProduct === 'mug' ? 'wrap' : 'front'
  );
  const [quantity, setQuantity] = useState(1);
  const [bulkModeOpen, setBulkModeOpen] = useState(false);
  const [bulkSizes, setBulkSizes] = useState<Record<string, number>>({
    S: 1,
    M: 2,
    L: 2,
    XL: 0,
    XXL: 0,
  });

  const [activeTool, setActiveTool] = useState<'templates' | 'upload' | 'text' | 'stickers' | 'layers'>('text');
  const [textInput, setTextInput] = useState('HELLO WORLD');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textFont, setTextFont] = useState('Sora');
  const [textSize, setTextSize] = useState(34);
  const [textRotate, setTextRotate] = useState(0);
  const [textBold, setTextBold] = useState(true);
  const [textItalic, setTextItalic] = useState(false);
  const [textOutline, setTextOutline] = useState(false);
  const [textShadow, setTextShadow] = useState(true);

  const [lightingMood, setLightingMood] = useState<LightingMood>('daylight');
  const [autoSpin, setAutoSpin] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [lowestImageDpi, setLowestImageDpi] = useState<number | null>(null);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);

  const [draftsModalOpen, setDraftsModalOpen] = useState(false);
  const [remoteDrafts, setRemoteDrafts] = useState<SavedDesign[]>([]);
  const [shareModalData, setShareModalData] = useState<{ url: string; summary: string } | null>(null);
  const [sharingBusy, setSharingBusy] = useState(false);
  const [copiedKey, setCopiedKey] = useState<'url' | 'summary' | null>(null);

  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [sync3DState, setSync3DState] = useState<'syncing' | 'synced'>('synced');
  const [designTitle, setDesignTitle] = useState('My Custom Design');
  const [tourStep, setTourStep] = useState<number>(hasSeenStudioTour ? -1 : 0);
  const motionEnabled = useMotionEnabled();

  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef<number>(-1);
  const isRestoringRef = useRef(false);
  const productTypeRef = useRef<ProductType>(initialProduct);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    productTypeRef.current = productType;
  }, [productType]);

  const syncFromCanvas = useCallback(
    (recordHistory = true) => {
      const fc = fabricRef.current;
      if (!fc) return;

      const objs = fc.getObjects();
      setLayers(
        objs.map((obj, idx) => ({
          index: idx,
          label:
            obj instanceof IText
              ? `Text: "${(obj.text || '').slice(0, 14)}"`
              : obj.type === 'image'
                ? 'Uploaded Photo'
                : `Element #${idx + 1}`,
          type: obj.type,
        }))
      );

      // Compute effective 300 DPI print sharpness for any uploaded raster image
      const physicalPrintWidthInches =
        productTypeRef.current === 'mug' ? 8 : productTypeRef.current === 'cap' ? 4.5 : 10;
      let minDpi: number | null = null;
      let foundPhoto = false;
      for (const obj of objs) {
        if (obj.type === 'image') {
          foundPhoto = true;
          const imgObj = obj as FabricImage;
          const el = imgObj.getElement() as HTMLImageElement | HTMLCanvasElement | undefined;
          const naturalW =
            (el && 'naturalWidth' in el ? el.naturalWidth : el?.width) || imgObj.width || 0;
          const naturalH =
            (el && 'naturalHeight' in el ? el.naturalHeight : el?.height) || imgObj.height || 0;
          const scaledW = Math.max(12, imgObj.getScaledWidth());
          const scaledH = Math.max(12, imgObj.getScaledHeight());
          const printedWInches = (scaledW / 340) * physicalPrintWidthInches;
          const printedHInches = (scaledH / 360) * (physicalPrintWidthInches * 1.06);
          if (naturalW > 0 && naturalH > 0) {
            const dpiW = naturalW / Math.max(0.4, printedWInches);
            const dpiH = naturalH / Math.max(0.4, printedHInches);
            const effDpi = Math.round(Math.min(dpiW, dpiH));
            minDpi = minDpi === null ? effDpi : Math.min(minDpi, effDpi);
          }
        }
      }
      setHasUploadedImage(foundPhoto);
      setLowestImageDpi(minDpi);

      const pngUrl = fc.toDataURL({ format: 'png', multiplier: 2 });
      setSync3DState('syncing');
      setTextureUrl(pngUrl);
      setTimeout(() => setSync3DState('synced'), 320);

      if (recordHistory && !isRestoringRef.current) {
        const jsonStr = JSON.stringify(fc.toJSON());
        const trimmed = historyRef.current.slice(0, historyIdxRef.current + 1);
        trimmed.push(jsonStr);
        if (trimmed.length > 25) trimmed.shift();
        historyRef.current = trimmed;
        historyIdxRef.current = trimmed.length - 1;
        setCanUndo(historyIdxRef.current > 0);
        setCanRedo(false);
        setSaveState('saving');
      }
    },
    []
  );

  const loadDraftIntoCanvas = useCallback(
    async (draft: SavedDesign) => {
      const fc = fabricRef.current;
      if (!fc || !draft.canvasJson) return;
      setProductType(draft.productType);
      setPrintArea(draft.printArea);
      setDesignTitle(draft.title);
      setSelectedColor({ name: draft.colorName, hex: draft.colorHex });
      isRestoringRef.current = true;
      await fc.loadFromJSON(draft.canvasJson);
      isRestoringRef.current = false;
      fc.renderAll();
      syncFromCanvas(true);
    },
    [syncFromCanvas]
  );

  useEffect(() => {
    api
      .getDesigns(user?.id)
      .then((list) => setRemoteDrafts(list))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!canvasElRef.current) return;
    const fc = new FabricCanvas(canvasElRef.current, {
      width: 340,
      height: 360,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
    });
    fabricRef.current = fc;

    const onModified = () => syncFromCanvas(true);
    fc.on('object:modified', onModified);
    fc.on('object:added', () => {
      if (!isRestoringRef.current) syncFromCanvas(true);
    });
    fc.on('object:removed', () => {
      if (!isRestoringRef.current) syncFromCanvas(true);
    });

    const existing = loadDesignId ? savedDesigns.find((d) => d.id === loadDesignId) : null;

    const initStarter = () => {
      const starter = new IText('DESIGNDROP', {
        left: 70,
        top: 145,
        fontFamily: 'Sora',
        fontSize: 32,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        cornerColor: '#7C3AED',
        cornerStyle: 'circle',
        cornerSize: 16,
        touchCornerSize: 28,
        transparentCorners: false,
      });
      fc.add(starter);
      fc.setActiveObject(starter);
      fc.renderAll();
      syncFromCanvas(true);
    };

    if (existing?.canvasJson) {
      loadDraftIntoCanvas(existing).catch(initStarter);
    } else if (loadDesignId) {
      api
        .getDesignById(loadDesignId)
        .then((remoteDesign) => {
          if (remoteDesign?.canvasJson) {
            saveDesignLocal(remoteDesign);
            loadDraftIntoCanvas(remoteDesign).catch(initStarter);
          } else {
            initStarter();
          }
        })
        .catch(() => initStarter());
    } else {
      initStarter();
    }

    return () => {
      fc.dispose();
      fabricRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!fabricRef.current || !textureUrl) return;
    setSaveState('saving');
    const timer = setTimeout(() => {
      const draft: SavedDesign = {
        id: 'draft-autosave',
        userId: user?.id,
        title: designTitle,
        productId: productType === 'mug' ? 'prod-3' : 'prod-1',
        productType: productType === 'mug' ? 'mug' : 'tshirt',
        colorName: selectedColor.name,
        colorHex: selectedColor.hex,
        printArea,
        canvasJson: JSON.stringify(fabricRef.current?.toJSON() || {}),
        previewDataUrl: textureUrl,
        updatedAt: new Date().toISOString(),
      };
      saveDesignLocal(draft);
      setSaveState('saved');
    }, 520);
    return () => clearTimeout(timer);
  }, [textureUrl, productType, selectedColor, printArea, designTitle]);

  const handleUndo = async () => {
    const fc = fabricRef.current;
    if (!fc || historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    const snapshot = historyRef.current[historyIdxRef.current];
    isRestoringRef.current = true;
    await fc.loadFromJSON(snapshot);
    isRestoringRef.current = false;
    fc.renderAll();
    syncFromCanvas(false);
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
  };

  const handleRedo = async () => {
    const fc = fabricRef.current;
    if (!fc || historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    const snapshot = historyRef.current[historyIdxRef.current];
    isRestoringRef.current = true;
    await fc.loadFromJSON(snapshot);
    isRestoringRef.current = false;
    fc.renderAll();
    syncFromCanvas(false);
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose a PNG or JPG photo file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = await FabricImage.fromURL(dataUrl);
      const scale = Math.min(200 / (img.width || 200), 200 / (img.height || 200));
      img.set({
        left: 70,
        top: 80,
        scaleX: scale,
        scaleY: scale,
        cornerColor: '#7C3AED',
        cornerStyle: 'circle',
        cornerSize: 16,
        touchCornerSize: 28,
        transparentCorners: false,
      });
      fabricRef.current?.add(img);
      fabricRef.current?.setActiveObject(img);
      fabricRef.current?.renderAll();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddText = () => {
    const fc = fabricRef.current;
    if (!fc || !textInput.trim()) return;
    const item = new IText(textInput.trim(), {
      left: 60,
      top: 140,
      fontFamily: textFont,
      fontSize: textSize,
      fill: textColor,
      angle: textRotate,
      fontWeight: textBold ? 'bold' : 'normal',
      fontStyle: textItalic ? 'italic' : 'normal',
      stroke: textOutline ? '#111116' : undefined,
      strokeWidth: textOutline ? 2 : 0,
      shadow: textShadow ? new Shadow({ color: 'rgba(0,0,0,0.45)', blur: 8, offsetX: 2, offsetY: 3 }) : undefined,
      cornerColor: '#7C3AED',
      cornerStyle: 'circle',
      cornerSize: 16,
      touchCornerSize: 28,
      transparentCorners: false,
    });
    fc.add(item);
    fc.setActiveObject(item);
    fc.renderAll();
  };

  const handleAddSticker = (sticker: StickerDef) => {
    const fc = fabricRef.current;
    if (!fc) return;
    let obj: FabricObject;
    if (sticker.kind === 'path' && sticker.pathData) {
      obj = new FabricPath(sticker.pathData, {
        left: 128,
        top: 128,
        fill: sticker.color,
        scaleX: 1.65,
        scaleY: 1.65,
      });
    } else if (sticker.kind === 'circle') {
      obj = new FabricCircle({ left: 128, top: 128, radius: 42, fill: sticker.color });
    } else if (sticker.kind === 'triangle') {
      obj = new FabricTriangle({ left: 128, top: 128, width: 88, height: 80, fill: sticker.color });
    } else if (sticker.kind === 'ring') {
      obj = new FabricCircle({
        left: 112,
        top: 112,
        radius: 56,
        fill: 'transparent',
        stroke: sticker.color,
        strokeWidth: 6,
      });
    } else {
      obj = new FabricRect({
        left: 110,
        top: 130,
        width: 116,
        height: 74,
        rx: 14,
        ry: 14,
        fill: 'transparent',
        stroke: sticker.color,
        strokeWidth: 6,
      });
    }
    obj.set({
      cornerColor: '#7C3AED',
      cornerStyle: 'circle',
      cornerSize: 16,
      touchCornerSize: 28,
      transparentCorners: false,
    });
    fc.add(obj);
    fc.setActiveObject(obj);
    fc.renderAll();
  };

  const applyStarterTemplate = (templateId: string) => {
    const fc = fabricRef.current;
    if (!fc) return;
    isRestoringRef.current = true;
    fc.clear();

    const commonControls = {
      cornerColor: '#7C3AED',
      cornerStyle: 'circle' as const,
      cornerSize: 16,
      touchCornerSize: 28,
      transparentCorners: false,
    };

    if (templateId === 'birthday') {
      const crown = new FabricPath(STICKERS[2].pathData!, {
        left: 128,
        top: 62,
        fill: '#FACC15',
        scaleX: 1.7,
        scaleY: 1.7,
        ...commonControls,
      });
      const line1 = new IText('HAPPY BIRTHDAY!', {
        left: 40,
        top: 162,
        fontFamily: 'Sora',
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#FF5A5F',
        ...commonControls,
      });
      const line2 = new IText('LEGEND SINCE 1998', {
        left: 72,
        top: 210,
        fontFamily: 'DM Sans',
        fontSize: 18,
        fontWeight: 'bold',
        fill: selectedColor.hex === '#FFFFFF' ? '#111116' : '#FFFFFF',
        ...commonControls,
      });
      fc.add(crown, line1, line2);
      setDesignTitle('Birthday Gift Tee');
    } else if (templateId === 'team') {
      const box = new FabricRect({
        left: 44,
        top: 90,
        width: 252,
        height: 170,
        rx: 20,
        ry: 20,
        fill: 'transparent',
        stroke: '#7C3AED',
        strokeWidth: 6,
        ...commonControls,
      });
      const num = new IText('07', {
        left: 120,
        top: 112,
        fontFamily: 'Sora',
        fontSize: 64,
        fontWeight: 'bold',
        fill: selectedColor.hex === '#FFFFFF' ? '#111116' : '#FFFFFF',
        ...commonControls,
      });
      const teamName = new IText('SUNDAY SQUAD', {
        left: 84,
        top: 200,
        fontFamily: 'Sora',
        fontSize: 20,
        fontWeight: 'bold',
        fill: '#FF5A5F',
        ...commonControls,
      });
      fc.add(box, num, teamName);
      setDesignTitle('Team Jersey 07');
    } else if (templateId === 'coffee') {
      const cup = new FabricPath(STICKERS[7].pathData!, {
        left: 128,
        top: 72,
        fill: '#D97706',
        scaleX: 1.7,
        scaleY: 1.7,
        ...commonControls,
      });
      const text = new IText('GOOD MORNING', {
        left: 55,
        top: 180,
        fontFamily: 'Sora',
        fontSize: 26,
        fontWeight: 'bold',
        fill: selectedColor.hex === '#FFFFFF' || selectedColor.hex === '#F5F3EE' ? '#111116' : '#FFFFFF',
        ...commonControls,
      });
      fc.add(cup, text);
      setDesignTitle('Morning Coffee Mug');
    } else {
      const ring = new FabricCircle({
        left: 96,
        top: 100,
        radius: 74,
        fill: 'transparent',
        stroke: '#10B981',
        strokeWidth: 5,
        ...commonControls,
      });
      const txt = new IText('STUDIO', {
        left: 112,
        top: 158,
        fontFamily: 'Sora',
        fontSize: 26,
        fontWeight: 'bold',
        fill: selectedColor.hex === '#FFFFFF' ? '#111116' : '#FFFFFF',
        ...commonControls,
      });
      fc.add(ring, txt);
      setDesignTitle('Minimal Badge');
    }

    isRestoringRef.current = false;
    fc.renderAll();
    syncFromCanvas(true);
    showToast('Starter layout added! Tap any text to change it.', 'success');
  };

  const moveLayer = (index: number, direction: 'up' | 'down' | 'delete') => {
    const fc = fabricRef.current;
    if (!fc) return;
    const obj = fc.getObjects()[index];
    if (!obj) return;
    if (direction === 'up') fc.bringObjectForward(obj);
    else if (direction === 'down') fc.sendObjectBackwards(obj);
    else fc.remove(obj);
    fc.renderAll();
    syncFromCanvas(true);
  };

  const mergedDrafts = React.useMemo(() => {
    const map = new Map<string, SavedDesign>();
    for (const d of [...savedDesigns, ...remoteDrafts]) {
      if (d.id === 'draft-autosave') continue;
      if (!map.has(d.id)) map.set(d.id, d);
    }
    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [savedDesigns, remoteDrafts]);

  const buildCurrentDesign = (id?: string): SavedDesign | null => {
    if (!fabricRef.current || !textureUrl) return null;
    return {
      id: id || `des-${Date.now()}`,
      userId: user?.id,
      title: designTitle || 'My Custom Design',
      productId:
        productType === 'mug'
          ? 'prod-3'
          : productType === 'hoodie'
            ? 'prod-5'
            : productType === 'cap'
              ? 'prod-9'
              : 'prod-1',
      productType: productType === 'mug' ? 'mug' : 'tshirt',
      colorName: selectedColor.name,
      colorHex: selectedColor.hex,
      printArea,
      canvasJson: JSON.stringify(fabricRef.current.toJSON()),
      previewDataUrl: textureUrl,
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSaveDesign = async () => {
    const design = buildCurrentDesign();
    if (!design) return;
    setSaveState('saving');
    saveDesignLocal(design);
    try {
      const saved = await api.saveDesign(design);
      setRemoteDrafts((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
      setSaveState('saved');
      showToast('Design saved! Reload it anytime from My Drafts or My Account.', 'success');
    } catch {
      setSaveState('saved');
      showToast('Design saved on this device.', 'success');
    }
  };

  const handleSharePreview = async () => {
    const design = buildCurrentDesign();
    if (!design) return;
    setSharingBusy(true);
    saveDesignLocal(design);
    let savedId = design.id;
    try {
      const saved = await api.saveDesign(design);
      savedId = saved.id;
      setRemoteDrafts((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
    } catch {
      // Fall back to local ID
    }
    const shareUrl = `${window.location.origin}/studio?designId=${encodeURIComponent(savedId)}`;
    const summary = [
      `DesignDrop Custom Preview: "${designTitle}"`,
      `Item: ${productType.toUpperCase()} (${selectedColor.name}, Size ${size})`,
      `Print Area: ${printArea} · 300 DPI Print Ready`,
      `Unit Price: Rs ${unitPrice} (18% GST included)`,
      `Open & Edit Link: ${shareUrl}`,
    ].join('\n');
    setShareModalData({ url: shareUrl, summary });
    setSharingBusy(false);
  };

  const copyShareText = async (text: string, which: 'url' | 'summary') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(which);
      showToast(which === 'url' ? 'Preview link copied!' : 'Design summary copied!', 'success');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      showToast('Copy failed. Please select and copy the text manually.', 'error');
    }
  };

  const handleDownloadPreview = () => {
    if (!textureUrl) return;
    const a = document.createElement('a');
    a.href = textureUrl;
    a.download = `DesignDrop-${productType}-preview.png`;
    a.click();
    showToast('Downloaded your design preview image!', 'success');
  };

  const baseUnit = PRODUCT_BASE_PRICE[productType];
  const printExtra = printArea === 'back' ? 120 : printArea === 'wrap' ? 50 : 80;
  const unitPrice = baseUnit + printExtra;

  const isGarment = productType === 'tshirt' || productType === 'hoodie';
  const bulkTotalUnits = Object.values(bulkSizes).reduce((acc, n) => acc + n, 0);
  const effectiveQty = bulkModeOpen && isGarment ? Math.max(1, bulkTotalUnits) : quantity;
  const grossPrice = unitPrice * effectiveQty;
  const qualifiesBundle = (productType === 'tshirt' || productType === 'mug') && effectiveQty >= 2;
  const bundleSaving = qualifiesBundle ? Math.round(grossPrice * 0.1) : 0;
  const totalPrice = grossPrice - bundleSaving;
  const perUnitAfterBundle = Math.round(totalPrice / Math.max(1, effectiveQty));

  const applyQuickQty = (qty: number) => {
    setQuantity(qty);
    if (isGarment && qty >= 5) {
      setBulkModeOpen(true);
      if (qty === 5) setBulkSizes({ S: 1, M: 2, L: 1, XL: 1, XXL: 0 });
      else if (qty === 10) setBulkSizes({ S: 2, M: 3, L: 3, XL: 1, XXL: 1 });
      else if (qty === 20) setBulkSizes({ S: 3, M: 6, L: 6, XL: 3, XXL: 2 });
    } else if (qty < 5) {
      setBulkModeOpen(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!fabricRef.current || !textureUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const labelMap: Record<ProductType, string> = {
      tshirt: 'Custom Cotton T-Shirt',
      mug: 'Custom Ceramic Mug',
      hoodie: 'Custom Fleece Hoodie',
      cap: 'Custom Cotton Cap',
    };
    const imgPath =
      productType === 'mug'
        ? '/src/assets/images/product_mug_ceramic_1794922913067.jpg'
        : productType === 'hoodie'
          ? '/src/assets/images/product_hoodie_violet_1794922912510.jpg'
          : productType === 'cap'
            ? '/src/assets/images/product_cap_classic_1794922912661.jpg'
            : '/src/assets/images/product_tshirt_charcoal_1794922912702.jpg';
    const prodId =
      productType === 'mug'
        ? 'prod-3'
        : productType === 'hoodie'
          ? 'prod-5'
          : productType === 'cap'
            ? 'prod-9'
            : 'prod-1';
    const canvasJsonStr = JSON.stringify(fabricRef.current.toJSON());
    const designIdStamp = `des-${Date.now()}`;

    if (bulkModeOpen && isGarment) {
      const entries = Object.entries(bulkSizes).filter(([, count]) => count > 0);
      if (entries.length === 0) {
        showToast('Pick at least 1 size in your team order helper.', 'error');
        return;
      }
      entries.forEach(([sz, count], idx) => {
        const isLast = idx === entries.length - 1;
        addToCart(
          {
            id: `custom-${Date.now()}-${sz}`,
            productId: prodId,
            productName: `${labelMap[productType]} (${designTitle})`,
            productType,
            imageUrl: imgPath,
            colorName: selectedColor.name,
            colorHex: selectedColor.hex,
            size: sz,
            printArea,
            quantity: count,
            unitPrice,
            designId: designIdStamp,
            designPreviewUrl: textureUrl,
            canvasJson: canvasJsonStr,
          },
          isLast ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined,
          { openDrawer: isLast, silentToast: !isLast }
        );
      });
      showToast(`Added ${bulkTotalUnits} team items (${entries.map(([s, c]) => `${c}×${s}`).join(', ')}) to cart!`, 'success');
      return;
    }

    addToCart(
      {
        id: `custom-${Date.now()}`,
        productId: prodId,
        productName: `${labelMap[productType]} (${designTitle})`,
        productType,
        imageUrl: imgPath,
        colorName: selectedColor.name,
        colorHex: selectedColor.hex,
        size,
        printArea,
        quantity,
        unitPrice,
        designId: designIdStamp,
        designPreviewUrl: textureUrl,
        canvasJson: canvasJsonStr,
      },
      { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    );
  };

  const switchProduct = (nextType: ProductType) => {
    setProductType(nextType);
    if (nextType === 'mug') {
      setPrintArea('wrap');
      setSize('11 oz');
      setSelectedColor({ name: 'Pure White', hex: '#FFFFFF' });
    } else if (nextType === 'cap') {
      setPrintArea('front');
      setSize('One Size');
      setSelectedColor({ name: 'Slate Navy', hex: '#1E293B' });
    } else {
      setPrintArea('front');
      setSize('M');
      setSelectedColor({ name: 'Charcoal Black', hex: '#18181B' });
    }
  };

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4 dark:border-white/10">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{t.studio.title}</h1>
            {/* Smooth Saving... -> Saved ✓ status pill */}
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                {saveState === 'saving' ? (
                  <motion.span
                    key="saving"
                    initial={motionEnabled ? { opacity: 0, y: 4 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={motionEnabled ? { opacity: 0, y: -4 } : undefined}
                    transition={{ duration: 0.16 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3 py-1 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </motion.span>
                ) : (
                  <motion.span
                    key="saved"
                    initial={motionEnabled ? { opacity: 0, scale: 0.92 } : false}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={motionEnabled ? { opacity: 0, scale: 0.92 } : undefined}
                    transition={{ duration: 0.18 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved ✓
                  </motion.span>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.span
                  key={sync3DState}
                  initial={motionEnabled ? { opacity: 0, y: 3 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={motionEnabled ? { opacity: 0, y: -3 } : undefined}
                  transition={{ duration: 0.16 }}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    sync3DState === 'syncing'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-black/10 bg-zinc-100 text-zinc-700 dark:border-white/12 dark:bg-white/8 dark:text-zinc-200'
                  }`}
                >
                  {sync3DState === 'syncing' ? 'Syncing 3D...' : '3D Synced'}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Add photos, text, or stickers in the middle. Turn and inspect the 3D item on the right.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTourStep(0)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-black/15 px-3.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            <HelpCircle className="h-4 w-4 text-[#7C3AED]" />
            Quick Tour
          </button>
          <button
            type="button"
            onClick={() => setDraftsModalOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-black/15 px-3.5 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            <FolderOpen className="h-4 w-4 text-[#7C3AED]" />
            {t.enhancements.myDrafts} ({mergedDrafts.length})
          </button>
          <button
            type="button"
            onClick={handleSaveDesign}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-black/15 px-4 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            <Save className="h-4 w-4" />
            {t.studio.saveDesign}
          </button>
          <button
            type="button"
            onClick={handleSharePreview}
            disabled={sharingBusy}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-4 text-sm font-semibold text-[#7C3AED] hover:bg-[#7C3AED]/15 disabled:opacity-50 dark:text-[#A78BFA]"
          >
            <Share2 className="h-4 w-4" />
            {t.enhancements.sharePreview}
          </button>
          <button
            type="button"
            onClick={handleDownloadPreview}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-black/15 px-4 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
            {t.studio.downloadPreview}
          </button>
        </div>
      </div>

      {tourStep >= 0 && tourStep < TOUR_STEPS.length && (
        <div
          role="dialog"
          aria-label="Design Studio quick tour"
          className="mt-4 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#7C3AED]/40 bg-[#7C3AED]/10 p-4 sm:flex-row sm:items-center"
        >
          <div>
            <div className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
              Tip {tourStep + 1} of {TOUR_STEPS.length}
            </div>
            <h2 className="mt-0.5 font-display text-base font-bold">{TOUR_STEPS[tourStep].title}</h2>
            <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{TOUR_STEPS[tourStep].text}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTourStep(-1);
                setHasSeenStudioTour(true);
              }}
              className="min-h-[44px] rounded-xl px-4 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => {
                if (tourStep + 1 >= TOUR_STEPS.length) {
                  setTourStep(-1);
                  setHasSeenStudioTour(true);
                } else {
                  setTourStep(tourStep + 1);
                }
              }}
              className="min-h-[44px] rounded-xl bg-[#7C3AED] px-5 text-sm font-semibold text-white"
            >
              {tourStep + 1 >= TOUR_STEPS.length ? 'Finish Tour' : 'Next'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* LEFT TOOLBAR */}
        <aside className="space-y-5 rounded-3xl border border-black/10 bg-white p-5 lg:col-span-4 xl:col-span-3 dark:border-white/10 dark:bg-[#16161D]">
          <div>
            <label htmlFor="design-name" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Design Name
            </label>
            <input
              id="design-name"
              value={designTitle}
              onChange={(e) => setDesignTitle(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-sm font-medium dark:border-white/15"
            />
          </div>

          <div>
            <div className="text-sm font-bold">1. Choose Item</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { id: 'tshirt', label: 'T-Shirt (Rs 599)' },
                { id: 'mug', label: 'Mug (Rs 349)' },
                { id: 'hoodie', label: 'Hoodie (Rs 1299)' },
                { id: 'cap', label: 'Cap (Rs 449)' },
              ].map((item) => {
                const active = productType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => switchProduct(item.id as ProductType)}
                    className={`relative min-h-[44px] rounded-xl border px-2 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-transparent text-white'
                        : 'border-black/15 hover:border-[#7C3AED]/50 dark:border-white/15'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId={motionEnabled ? 'studio-product-pill' : undefined}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-xl bg-[#7C3AED]"
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold">2. {t.studio.sizeAndColor}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  aria-label={`Color ${c.name}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                    selectedColor.hex === c.hex
                      ? 'scale-110 border-[#7C3AED] ring-2 ring-[#7C3AED]/40'
                      : 'border-black/20 dark:border-white/20'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {selectedColor.hex === c.hex && (
                    <Check
                      className={`h-4 w-4 ${
                        ['#FFFFFF', '#F5F3EE'].includes(c.hex) ? 'text-black' : 'text-white'
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(productType === 'mug'
                ? ['11 oz', '15 oz']
                : productType === 'cap'
                  ? ['One Size']
                  : ['S', 'M', 'L', 'XL', 'XXL']
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`min-h-[40px] rounded-lg border px-3 text-xs font-semibold ${
                    size === s
                      ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                      : 'border-black/15 dark:border-white/15'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold">3. {t.studio.whereToPrint}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {productType === 'tshirt' || productType === 'hoodie' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPrintArea('front')}
                    className={`min-h-[44px] rounded-xl border text-xs font-semibold ${
                      printArea === 'front'
                        ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A78BFA]'
                        : 'border-black/15 dark:border-white/15'
                    }`}
                  >
                    {t.studio.front} (+Rs 80)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintArea('back')}
                    className={`min-h-[44px] rounded-xl border text-xs font-semibold ${
                      printArea === 'back'
                        ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A78BFA]'
                        : 'border-black/15 dark:border-white/15'
                    }`}
                  >
                    {t.studio.back} (+Rs 120)
                  </button>
                </>
              ) : productType === 'cap' ? (
                <button
                  type="button"
                  onClick={() => setPrintArea('front')}
                  className="col-span-2 min-h-[44px] rounded-xl border border-[#7C3AED] bg-[#7C3AED]/15 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]"
                >
                  Front Panel (+Rs 80)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPrintArea('wrap')}
                  className="col-span-2 min-h-[44px] rounded-xl border border-[#7C3AED] bg-[#7C3AED]/15 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]"
                >
                  {t.studio.wrap} (+Rs 50)
                </button>
              )}
            </div>
          </div>

          {/* Add Elements Tabs */}
          <div>
            <div className="text-sm font-bold">4. Add Elements</div>
            <div className="mt-2 grid grid-cols-5 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-[#1E1E28]">
              {[
                { id: 'templates', icon: Wand2, label: 'Looks' },
                { id: 'upload', icon: Upload, label: 'Photo' },
                { id: 'text', icon: Type, label: 'Text' },
                { id: 'stickers', icon: Smile, label: 'Elements' },
                { id: 'layers', icon: Layers, label: 'Layers' },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTool === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTool(tab.id as typeof activeTool)}
                    className={`relative flex min-h-[44px] flex-col items-center justify-center rounded-lg text-[10px] font-semibold transition-colors ${
                      active
                        ? 'text-[#7C3AED] dark:text-[#A78BFA]'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId={motionEnabled ? 'studio-tool-pill' : undefined}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-[#2A2A36]"
                      />
                    )}
                    <span className="relative z-10 flex flex-col items-center">
                      <Icon className="h-4 w-4" />
                      <span className="mt-0.5">{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 rounded-2xl border border-black/10 p-3.5 dark:border-white/10">
              {activeTool === 'templates' && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500">Pick a 1-tap starter look, then edit any word:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STARTER_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => applyStarterTemplate(tpl.id)}
                        className="flex min-h-[48px] flex-col items-start justify-center rounded-xl border border-black/15 px-3 py-2 text-left text-xs font-semibold hover:border-[#7C3AED] dark:border-white/15"
                      >
                        <span className="h-1.5 w-6 rounded-full mb-1" style={{ backgroundColor: tpl.accent }} />
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'upload' && (
                <div className="text-center">
                  <label className="flex min-h-[84px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#7C3AED]/40 bg-[#7C3AED]/5 p-4 text-sm font-semibold text-[#7C3AED] hover:bg-[#7C3AED]/10 dark:text-[#A78BFA]">
                    <Upload className="h-6 w-6" />
                    <span className="mt-2">{t.studio.uploadPhoto} (PNG / JPG)</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-2 text-xs text-zinc-500">
                    Clear, bright photos look best when printed.
                  </p>
                </div>
              )}

              {activeTool === 'text' && (
                <div className="space-y-3">
                  <input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type a name or message"
                    aria-label="Text to add"
                    className="min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-3 text-sm dark:border-white/15"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={textFont}
                      onChange={(e) => setTextFont(e.target.value)}
                      aria-label="Font style"
                      className="min-h-[44px] rounded-xl border border-black/15 bg-transparent px-2 text-xs dark:border-white/15 dark:bg-[#16161D]"
                    >
                      {FONTS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={14}
                      max={72}
                      value={textSize}
                      onChange={(e) => setTextSize(Number(e.target.value))}
                      aria-label="Text size"
                      className="min-h-[44px] rounded-xl border border-black/15 bg-transparent px-3 text-xs dark:border-white/15"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Bold', active: textBold, toggle: () => setTextBold((v) => !v) },
                      { label: 'Italic', active: textItalic, toggle: () => setTextItalic((v) => !v) },
                      { label: 'Outline', active: textOutline, toggle: () => setTextOutline((v) => !v) },
                      { label: 'Shadow', active: textShadow, toggle: () => setTextShadow((v) => !v) },
                    ].map((fx) => (
                      <button
                        key={fx.label}
                        type="button"
                        onClick={fx.toggle}
                        className={`min-h-[34px] rounded-lg border px-2.5 text-xs font-semibold ${
                          fx.active
                            ? 'border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A78BFA]'
                            : 'border-black/15 dark:border-white/15'
                        }`}
                      >
                        {fx.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTextColor(c)}
                        aria-label={`Text color ${c}`}
                        className={`h-7 w-7 rounded-full border-2 ${
                          textColor === c ? 'border-[#7C3AED] scale-110' : 'border-black/20 dark:border-white/20'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <label className="block text-xs">
                    Tilt angle ({textRotate}°)
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      value={textRotate}
                      onChange={(e) => setTextRotate(Number(e.target.value))}
                      className="mt-1 w-full accent-[#7C3AED]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAddText}
                    className="min-h-[44px] w-full rounded-xl bg-[#7C3AED] text-sm font-semibold text-white hover:bg-[#6D28D9]"
                  >
                    + {t.studio.addText}
                  </button>
                </div>
              )}

              {activeTool === 'stickers' && (
                <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1">
                  {STICKERS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleAddSticker(s)}
                      className="flex min-h-[46px] flex-col items-center justify-center gap-1 rounded-xl border border-black/15 px-2 py-1.5 text-[11px] font-semibold hover:border-[#7C3AED] dark:border-white/15"
                    >
                      <Sparkles className="h-3.5 w-3.5" style={{ color: s.color }} />
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTool === 'layers' && (
                <div className="space-y-2">
                  {layers.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      No items added yet. Add a photo, text, or sticker first!
                    </p>
                  ) : (
                    layers.map((layer) => (
                      <div
                        key={`${layer.index}-${layer.label}`}
                        className="flex items-center justify-between gap-2 rounded-xl border border-black/10 px-2.5 py-2 text-xs dark:border-white/10"
                      >
                        <span className="truncate font-medium">{layer.label}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveLayer(layer.index, 'up')}
                            aria-label="Bring forward"
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLayer(layer.index, 'down')}
                            aria-label="Send backward"
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLayer(layer.index, 'delete')}
                            aria-label="Delete item"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* CENTER 2D DESIGN AREA */}
        <section className="flex flex-col items-center rounded-3xl border border-black/10 bg-white p-5 lg:col-span-4 xl:col-span-5 dark:border-white/10 dark:bg-[#16161D]">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold">{t.studio.designArea}</h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSafeZone((v) => !v)}
                aria-pressed={showSafeZone}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                  showSafeZone
                    ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A78BFA]'
                    : 'border-black/15 text-zinc-600 dark:border-white/15 dark:text-zinc-300'
                }`}
              >
                {showSafeZone ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{t.enhancements.safeZoneToggle}</span>
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-black/15 px-3 text-xs font-semibold disabled:opacity-40 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                <Undo2 className="h-4 w-4" />
                <span>{t.studio.undo}</span>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-black/15 px-3 text-xs font-semibold disabled:opacity-40 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                <Redo2 className="h-4 w-4" />
                <span>{t.studio.redo}</span>
              </button>
            </div>
          </div>

          {/* 300 DPI Print Resolution Check Badge */}
          <div className="mt-3 w-full max-w-[380px]">
            {hasUploadedImage && lowestImageDpi !== null && lowestImageDpi < 220 ? (
              <div
                role="status"
                className="flex items-start gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <div className="font-bold">
                    {t.enhancements.dpiWarn} (~{lowestImageDpi} DPI)
                  </div>
                  <p className="mt-0.5 leading-relaxed opacity-90">{t.enhancements.dpiLowTip}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  {t.enhancements.dpiGood}
                  {hasUploadedImage && lowestImageDpi ? ` (~${lowestImageDpi} DPI)` : ''}
                </span>
                <span className="text-[11px] opacity-80">300 DPI</span>
              </div>
            )}
          </div>

          <div
            className="relative mt-4 flex w-full max-w-[380px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#7C3AED]/45 p-4 touch-none"
            style={{ backgroundColor: selectedColor.hex }}
          >
            <canvas ref={canvasElRef} className="max-w-full rounded-xl" />

            {/* Non-printable Safe Print Zone overlay (never exported in PNG) */}
            {showSafeZone && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-emerald-400/80"
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow">
                  {t.enhancements.safeZoneBadge}
                </span>
                <span className="absolute -left-1 -top-1 h-3 w-3 border-l-2 border-t-2 border-emerald-400" />
                <span className="absolute -right-1 -top-1 h-3 w-3 border-r-2 border-t-2 border-emerald-400" />
                <span className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-emerald-400" />
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Keep key text & faces inside the green safe box. Pull any corner dot to resize or spin.
          </p>
        </section>

        {/* RIGHT LIVE 3D PREVIEW + STUDIO LIGHTING + CART */}
        <aside className="flex flex-col rounded-3xl border border-black/10 bg-white p-5 lg:col-span-4 dark:border-white/10 dark:bg-[#16161D]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold">Live 3D Preview</h2>
            <button
              type="button"
              onClick={() => setAutoSpin((s) => !s)}
              aria-pressed={autoSpin}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                autoSpin
                  ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                  : 'border-black/15 dark:border-white/15'
              }`}
            >
              <RotateCw className="h-3.5 w-3.5" />
              360° Spin
            </button>
          </div>

          <div className="studio-stage-bg featured-glow-border mt-3 h-[300px] w-full overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm">{t.studio.getting3DReady}</div>}>
              <Product3DViewer
                productType={productType}
                colorHex={selectedColor.hex}
                printArea={printArea}
                textureSourceUrl={textureUrl}
                autoSpin={autoSpin}
                lightingMood={lightingMood}
                onCameraPreset={printArea === 'back' ? 'back' : 'front'}
                fallbackImageUrl={
                  productType === 'mug'
                    ? '/src/assets/images/product_mug_ceramic_1794922913067.jpg'
                    : '/src/assets/images/product_tshirt_charcoal_1794922912702.jpg'
                }
              />
            </Suspense>
          </div>

          {/* 3D Studio Lighting Moods with shared-layout sliding pill */}
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-black/10 p-2 dark:border-white/10">
            <span className="pl-1 text-xs font-semibold text-zinc-500">Studio Light</span>
            <div className="flex gap-1">
              {[
                { id: 'daylight', label: 'Daylight' },
                { id: 'violet', label: 'Violet' },
                { id: 'sunset', label: 'Sunset' },
              ].map((m) => {
                const active = lightingMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setLightingMood(m.id as LightingMood)}
                    className={`relative min-h-[32px] rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'text-white'
                        : 'text-zinc-600 hover:text-[#111116] dark:text-zinc-300 dark:hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId={motionEnabled ? 'studio-light-pill' : undefined}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-lg bg-[#7C3AED]"
                      />
                    )}
                    <span className="relative z-10">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 space-y-3 rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Quantity</span>
              {!bulkModeOpen && (
                <div className="inline-flex items-center rounded-xl border border-black/15 dark:border-white/15">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex h-10 w-10 items-center justify-center transition active:scale-90"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-bold tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="flex h-10 w-10 items-center justify-center transition active:scale-90"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
              {bulkModeOpen && isGarment && (
                <span className="rounded-lg bg-[#7C3AED]/15 px-2.5 py-1 text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA] tabular-nums">
                  {effectiveQty} team units
                </span>
              )}
            </div>

            {/* Quick Bulk / Team Quantity Chips */}
            <div className="rounded-xl border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-[#1E1E28]">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200">
                  <Users className="h-3.5 w-3.5 text-[#7C3AED]" />
                  {t.enhancements.bulkHelperTitle}
                </span>
                {isGarment && (
                  <button
                    type="button"
                    onClick={() => setBulkModeOpen((v) => !v)}
                    className="text-[11px] font-semibold text-[#7C3AED] underline dark:text-[#A78BFA]"
                  >
                    {bulkModeOpen ? 'Single size' : 'Split sizes'}
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                {t.enhancements.bulkSubtext}
              </p>

              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[1, 5, 10, 20].map((preset) => {
                  const isActive = effectiveQty === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyQuickQty(preset)}
                      className={`min-h-[34px] rounded-lg border text-xs font-bold tabular-nums transition ${
                        isActive
                          ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                          : 'border-black/15 bg-white hover:border-[#7C3AED]/50 dark:border-white/15 dark:bg-[#16161D]'
                      }`}
                    >
                      {preset === 1 ? '1 pc' : `${preset} pcs`}
                    </button>
                  );
                })}
              </div>

              {bulkModeOpen && isGarment && (
                <div className="mt-2.5 grid grid-cols-5 gap-1.5 border-t border-black/10 pt-2.5 dark:border-white/10">
                  {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => (
                    <div key={sz} className="text-center">
                      <div className="text-[10px] font-bold text-zinc-500">{sz}</div>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={bulkSizes[sz] ?? 0}
                        onChange={(e) =>
                          setBulkSizes((prev) => ({
                            ...prev,
                            [sz]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        aria-label={`Quantity for size ${sz}`}
                        className="mt-1 h-8 w-full rounded-lg border border-black/15 bg-white text-center text-xs font-bold tabular-nums dark:border-white/15 dark:bg-[#16161D]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span className="capitalize">
                {productType} base + {printArea} print
              </span>
              <span className="tabular-nums">
                Rs {unitPrice} × {effectiveQty}
              </span>
            </div>
            {bundleSaving > 0 && (
              <div className="flex justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>10% Bundle Offer (2+ {productType === 'mug' ? 'Mugs' : 'Tees'})</span>
                <span className="tabular-nums">-Rs {bundleSaving}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-black/10 pt-3 dark:border-white/10">
              <div>
                <AnimatedNumber value={totalPrice} prefix="Rs " className="font-display text-xl font-extrabold" />
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{t.studio.priceIncludesTax}</span>
                  {effectiveQty > 1 && (
                    <span className="font-semibold text-[#7C3AED] dark:text-[#A78BFA] tabular-nums">
                      (Rs {perUnitAfterBundle}/pc)
                    </span>
                  )}
                  <HelpTooltip
                    label="About price and tax"
                    text="18% GST tax is included in this total. Free delivery applies automatically if your cart reaches Rs 599."
                  />
                </div>
              </div>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={motionEnabled ? { y: -1 } : undefined}
            whileTap={motionEnabled ? { scale: 0.96 } : undefined}
            onClick={handleAddToCart}
            className="mt-4 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-6 text-base font-semibold text-white shadow-lg shadow-[#7C3AED]/25 transition hover:bg-[#6D28D9]"
          >
            <ShoppingBag className="h-5 w-5" />
            {effectiveQty > 1 ? `${t.studio.addToCart} (${effectiveQty} pcs)` : t.studio.addToCart}
          </motion.button>
        </aside>
      </div>

      {/* SAVED DRAFTS MODAL */}
      {draftsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Saved design drafts"
        >
          <div className="max-h-[82vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#16161D]">
            <div className="flex items-center justify-between border-b border-black/10 pb-3 dark:border-white/10">
              <div>
                <h2 className="font-display text-xl font-extrabold">{t.enhancements.myDrafts}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Reload any saved custom design right back into the studio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraftsModalOpen(false)}
                aria-label="Close drafts"
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {mergedDrafts.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-500">
                No saved drafts yet. Click <strong>{t.studio.saveDesign}</strong> to keep your work!
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {mergedDrafts.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 p-3 dark:border-white/10"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl p-1.5"
                        style={{ backgroundColor: d.colorHex }}
                      >
                        {d.previewDataUrl ? (
                          <img src={d.previewDataUrl} alt={d.title} className="h-full w-full object-contain" />
                        ) : (
                          <Sparkles className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold">{d.title}</div>
                        <div className="text-xs text-zinc-500 capitalize">
                          {d.productType} · {d.colorName} · {d.printArea}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Saved {new Date(d.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await loadDraftIntoCanvas(d);
                          setDraftsModalOpen(false);
                          showToast(`Loaded "${d.title}" into Design Studio!`, 'success');
                        }}
                        className="min-h-[38px] rounded-xl bg-[#7C3AED] px-3.5 text-xs font-semibold text-white hover:bg-[#6D28D9]"
                      >
                        Reload
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          deleteDesignLocal(d.id);
                          setRemoteDrafts((prev) => prev.filter((x) => x.id !== d.id));
                          api.deleteDesign(d.id).catch(() => {});
                          showToast('Removed saved draft.', 'info');
                        }}
                        aria-label={`Delete ${d.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHAREABLE PREVIEW LINK & SUMMARY MODAL */}
      {shareModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Share custom design preview"
        >
          <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#16161D]">
            <div className="flex items-center justify-between border-b border-black/10 pb-3 dark:border-white/10">
              <div>
                <h2 className="font-display text-xl font-extrabold">{t.enhancements.sharePreview}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Share this link with friends, family, or teammates to preview or edit this design.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareModalData(null)}
                aria-label="Close share dialog"
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Shareable Studio Link
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    readOnly
                    value={shareModalData.url}
                    className="min-h-[44px] flex-1 rounded-xl border border-black/15 bg-zinc-50 px-3 font-mono text-xs dark:border-white/15 dark:bg-[#1E1E28]"
                  />
                  <button
                    type="button"
                    onClick={() => copyShareText(shareModalData.url, 'url')}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 text-xs font-semibold text-white hover:bg-[#6D28D9]"
                  >
                    {copiedKey === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedKey === 'url' ? 'Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Quick Text Summary (Great for WhatsApp / Team Chat)
                </label>
                <textarea
                  readOnly
                  rows={5}
                  value={shareModalData.summary}
                  className="mt-1.5 w-full rounded-xl border border-black/15 bg-zinc-50 p-3 text-xs leading-relaxed dark:border-white/15 dark:bg-[#1E1E28]"
                />
                <button
                  type="button"
                  onClick={() => copyShareText(shareModalData.summary, 'summary')}
                  className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-black/15 px-4 text-xs font-semibold hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >
                  {copiedKey === 'summary' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copiedKey === 'summary' ? 'Summary Copied!' : 'Copy Summary'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

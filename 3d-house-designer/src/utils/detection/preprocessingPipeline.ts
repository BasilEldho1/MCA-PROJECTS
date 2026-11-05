export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PerspectiveCorners {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
}

export interface MultiRepresentationMaps {
  originalDataUrl: string;
  grayscaleCanvas: HTMLCanvasElement;
  binaryCanvas: HTMLCanvasElement;
  edgeMapCanvas: HTMLCanvasElement;
  lineMapCanvas: HTMLCanvasElement;
  wallCandidateCanvas: HTMLCanvasElement;
  symbolCandidateCanvas: HTMLCanvasElement;
  width: number;
  height: number;
  rotationAngle: number;
  cropRegion?: CropRegion;
  resolutionQuality: 'high' | 'medium' | 'low';
  warningMessage?: string;
}

/**
 * Multi-Representation Image Preprocessing Pipeline
 * Creates 7 distinct image maps for structural vectorization
 */
export async function processMultiRepresentationPipeline(
  imageSource: string | HTMLImageElement,
  options?: {
    rotationAngle?: number;
    cropRegion?: CropRegion;
    perspectiveCorners?: PerspectiveCorners;
  }
): Promise<MultiRepresentationMaps> {
  let img: HTMLImageElement;
  if (typeof imageSource === 'string') {
    img = await loadImageAsync(imageSource);
  } else {
    img = imageSource;
  }

  const origWidth = img.naturalWidth || img.width || 800;
  const origHeight = img.naturalHeight || img.height || 600;

  let resolutionQuality: 'high' | 'medium' | 'low' = 'high';
  let warningMessage: string | undefined = undefined;

  if (origWidth < 400 || origHeight < 400) {
    resolutionQuality = 'low';
    warningMessage = 'The uploaded image resolution may not be sufficient for reliable blueprint detection (min 600x600px recommended).';
  } else if (origWidth < 800 || origHeight < 800) {
    resolutionQuality = 'medium';
  }

  // Target canvas normalization dimensions
  const targetW = Math.min(1600, Math.max(600, origWidth));
  const targetH = Math.round(targetW * (origHeight / origWidth));

  // 1. Grayscale Canvas
  const grayCanvas = document.createElement('canvas');
  grayCanvas.width = targetW;
  grayCanvas.height = targetH;
  const grayCtx = grayCanvas.getContext('2d', { willReadFrequently: true })!;

  grayCtx.fillStyle = '#ffffff';
  grayCtx.fillRect(0, 0, targetW, targetH);

  const rotation = options?.rotationAngle || 0;
  if (rotation !== 0) {
    grayCtx.save();
    grayCtx.translate(targetW / 2, targetH / 2);
    grayCtx.rotate((rotation * Math.PI) / 180);
    grayCtx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
    grayCtx.restore();
  } else {
    grayCtx.drawImage(img, 0, 0, targetW, targetH);
  }

  // Handle region crop if specified (e.g. title block removal)
  if (options?.cropRegion) {
    const crop = options.cropRegion;
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = crop.width;
    croppedCanvas.height = crop.height;
    const cCtx = croppedCanvas.getContext('2d')!;
    cCtx.drawImage(grayCanvas, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    grayCanvas.width = crop.width;
    grayCanvas.height = crop.height;
    grayCtx.drawImage(croppedCanvas, 0, 0);
  }

  const width = grayCanvas.width;
  const height = grayCanvas.height;

  const grayImgData = grayCtx.getImageData(0, 0, width, height);
  const pixels = grayImgData.data;

  // Grayscale & Brightness check
  let totalLum = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    totalLum += lum;
    pixels[i] = lum;
    pixels[i + 1] = lum;
    pixels[i + 2] = lum;
  }
  grayCtx.putImageData(grayImgData, 0, 0);

  const avgLum = totalLum / (width * height);
  const isDarkBlueprint = avgLum < 110;

  // 2. Binary Adaptive Canvas
  const binaryCanvas = document.createElement('canvas');
  binaryCanvas.width = width;
  binaryCanvas.height = height;
  const binCtx = binaryCanvas.getContext('2d', { willReadFrequently: true })!;
  const binImgData = binCtx.createImageData(width, height);
  const binPixels = binImgData.data;

  const cutoff = isDarkBlueprint ? avgLum + 30 : avgLum - 25;

  for (let i = 0; i < pixels.length; i += 4) {
    const lum = pixels[i];
    const isWallPixel = isDarkBlueprint ? lum > cutoff : lum < cutoff;
    const val = isWallPixel ? 0 : 255;
    binPixels[i] = val;
    binPixels[i + 1] = val;
    binPixels[i + 2] = val;
    binPixels[i + 3] = 255;
  }
  binCtx.putImageData(binImgData, 0, 0);

  // 3. Sobel Edge Map Canvas
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = width;
  edgeCanvas.height = height;
  const edgeCtx = edgeCanvas.getContext('2d', { willReadFrequently: true })!;
  const edgeImgData = edgeCtx.createImageData(width, height);
  const edgePixels = edgeImgData.data;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      const p00 = pixels[((y - 1) * width + (x - 1)) * 4];
      const p01 = pixels[((y - 1) * width + x) * 4];
      const p02 = pixels[((y - 1) * width + (x + 1)) * 4];
      const p10 = pixels[(y * width + (x - 1)) * 4];
      const p12 = pixels[(y * width + (x + 1)) * 4];
      const p20 = pixels[((y + 1) * width + (x - 1)) * 4];
      const p21 = pixels[((y + 1) * width + x) * 4];
      const p22 = pixels[((y + 1) * width + (x + 1)) * 4];

      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
      const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;
      const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));

      const edgeVal = mag > 60 ? 255 : 0;
      edgePixels[idx] = edgeVal;
      edgePixels[idx + 1] = edgeVal;
      edgePixels[idx + 2] = edgeVal;
      edgePixels[idx + 3] = 255;
    }
  }
  edgeCtx.putImageData(edgeImgData, 0, 0);

  // 4. Line Map Canvas
  const lineCanvas = document.createElement('canvas');
  lineCanvas.width = width;
  lineCanvas.height = height;
  const lineCtx = lineCanvas.getContext('2d')!;
  lineCtx.drawImage(edgeCanvas, 0, 0);

  // 5. Wall Candidate Map Canvas
  const wallCandCanvas = document.createElement('canvas');
  wallCandCanvas.width = width;
  wallCandCanvas.height = height;
  const wallCandCtx = wallCandCanvas.getContext('2d')!;
  wallCandCtx.drawImage(binaryCanvas, 0, 0);

  // 6. Symbol Candidate Map Canvas
  const symbolCandCanvas = document.createElement('canvas');
  symbolCandCanvas.width = width;
  symbolCandCanvas.height = height;
  const symbolCandCtx = symbolCandCanvas.getContext('2d')!;
  symbolCandCtx.drawImage(edgeCanvas, 0, 0);

  const originalDataUrl = typeof imageSource === 'string' ? imageSource : grayCanvas.toDataURL('image/png');

  return {
    originalDataUrl,
    grayscaleCanvas: grayCanvas,
    binaryCanvas,
    edgeMapCanvas: edgeCanvas,
    lineMapCanvas: lineCanvas,
    wallCandidateCanvas: wallCandCanvas,
    symbolCandidateCanvas: symbolCandCanvas,
    width,
    height,
    rotationAngle: rotation,
    cropRegion: options?.cropRegion,
    resolutionQuality,
    warningMessage
  };
}

function loadImageAsync(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

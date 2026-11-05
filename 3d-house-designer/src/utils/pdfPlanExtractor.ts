/**
 * PDF Floor Plan Rasterizer & Vector Text/Geometry Extractor
 */
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker for Vite/browser environment
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    // Use worker from unpkg or inline fallback
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('[pdfPlanExtractor] Worker setup notice:', e);
}

export interface ExtractedPdfPlan {
  pageCount: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
  extractedTexts: { text: string; x: number; y: number; width: number; height: number }[];
  extractedDimensions: { rawText: string; value: number; unit: string; x: number; y: number }[];
  detectedScale?: string;
}

/**
 * Render first page of uploaded PDF blueprint onto a high-resolution canvas
 * and extract all textual annotations, dimension labels, and title blocks.
 */
export async function renderPdfFloorPlanToCanvas(
  pdfData: ArrayBuffer | Uint8Array | string
): Promise<ExtractedPdfPlan> {
  let loadingTask: any;

  if (typeof pdfData === 'string' && pdfData.startsWith('data:')) {
    const base64 = pdfData.split(',')[1];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    loadingTask = pdfjsLib.getDocument({ data: bytes });
  } else {
    loadingTask = pdfjsLib.getDocument({ data: pdfData as any });
  }

  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const page = await pdf.getPage(1);

  // High resolution render (2.5x scale for sharp CAD lines & small text)
  const scale = 2.5;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Could not create canvas context for PDF rendering');
  }

  // White architectural background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };

  await page.render(renderContext).promise;

  // Extract text layer (dimensions, room names, title blocks)
  const textContent = await page.getTextContent();
  const extractedTexts: { text: string; x: number; y: number; width: number; height: number }[] = [];
  const extractedDimensions: { rawText: string; value: number; unit: string; x: number; y: number }[] = [];
  let detectedScale: string | undefined = undefined;

  // Dimension regexes (e.g., 12'-6", 14x16, 4.5m, 12 ft, 3500mm, etc.)
  const dimRegex = /(\d+['’]?-?\d*["”]?|\d+(?:\.\d+)?\s*(?:m|ft|feet|meters|mm|cm|in))/i;
  const scaleRegex = /(?:scale[:\s]+)?(1\/[248]"?\s*=\s*1'?-?0"?|1:\d{2,3})/i;

  textContent.items.forEach((item: any) => {
    if (!item.str || !item.str.trim()) return;
    const str = item.str.trim();

    // Calculate approximate coordinates in viewport space
    const tx = item.transform;
    const x = tx ? tx[4] * (scale / (viewport.scale / scale)) : 0;
    const y = tx ? viewport.height - (tx[5] * (scale / (viewport.scale / scale))) : 0;

    extractedTexts.push({
      text: str,
      x,
      y,
      width: item.width * scale,
      height: item.height * scale
    });

    // Check for architectural scale
    const scaleMatch = str.match(scaleRegex);
    if (scaleMatch && !detectedScale) {
      detectedScale = scaleMatch[0];
    }

    // Check for dimension markers
    const dimMatch = str.match(dimRegex);
    if (dimMatch) {
      let val = parseFloat(dimMatch[1]);
      let u = 'feet';
      if (str.toLowerCase().includes('m') && !str.toLowerCase().includes('mm')) u = 'meters';
      if (str.includes("'")) {
        // e.g. 14'-6"
        const parts = str.split(/['-]/);
        if (parts.length >= 2) {
          val = parseFloat(parts[0]) + (parseFloat(parts[1]) || 0) / 12;
        }
      }
      if (!isNaN(val) && val > 0 && val < 500) {
        extractedDimensions.push({
          rawText: str,
          value: val,
          unit: u,
          x,
          y
        });
      }
    }
  });

  const dataUrl = canvas.toDataURL('image/png', 0.95);

  return {
    pageCount,
    canvas,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    extractedTexts,
    extractedDimensions,
    detectedScale
  };
}

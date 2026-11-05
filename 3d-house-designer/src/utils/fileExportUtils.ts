import jsPDF from 'jspdf';
import { Project, UnitType } from '../types/floorplan';
import { formatArea } from './unitConverter';

export interface SaveFileOptions {
  blob: Blob;
  defaultFilename: string;
  extension: 'png' | 'pdf' | 'json';
  mimeType: string;
  description?: string;
}

export interface SaveFileResult {
  success: boolean;
  method: 'picker' | 'download';
  filename: string;
}

/**
 * Clean and normalize filename to prevent duplicate extensions (e.g. .png.png)
 */
export function sanitizeFilename(filename: string, extension: string): string {
  const extRegex = new RegExp(`\\.${extension}$`, 'i');
  const base = filename.replace(extRegex, '').trim().replace(/[/\\?%*:|"<>]/g, '_');
  return `${base || 'FloorPlan'}.${extension}`;
}

/**
 * Save file to device using browser's File System Access API (showSaveFilePicker)
 * when supported, with automatic reliable download fallback for unsupported browsers.
 */
export async function saveFileToDevice(options: SaveFileOptions): Promise<SaveFileResult> {
  const { blob, defaultFilename, extension, mimeType, description = 'Exported File' } = options;
  const targetFilename = sanitizeFilename(defaultFilename, extension);

  // Check if browser supports File System Access API
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const picker = (window as any).showSaveFilePicker;
      const handle = await picker({
        suggestedName: targetFilename,
        types: [
          {
            description: description,
            accept: {
              [mimeType]: [`.${extension}`]
            }
          }
        ]
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      return {
        success: true,
        method: 'picker',
        filename: handle.name || targetFilename
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Save cancelled by user');
      }
      console.warn('[saveFileToDevice] File System Access API error, using download fallback:', err);
      // Fallback below
    }
  }

  // Reliable fallback: standard browser download trigger
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = targetFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    return {
      success: true,
      method: 'download',
      filename: targetFilename
    };
  } catch (err: any) {
    throw new Error(`Failed to save file to device: ${err.message}`);
  }
}

/**
 * Capture high-resolution clean 2D floor plan rendering directly from project geometry.
 * Renders on a clean off-screen canvas without website UI buttons, navbars, or tools.
 */
export function generate2DPlanPng(
  project: Project,
  options: {
    width?: number;
    height?: number;
    showDimensions?: boolean;
    showRoomLabels?: boolean;
    showFurniture?: boolean;
  } = {}
): { dataUrl: string; blob: Blob } {
  const {
    width = 2400,
    height = 1800,
    showDimensions = true,
    showRoomLabels = true,
    showFurniture = true
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  // Clean Architectural Canvas Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const plotW = Math.max(project.plotWidth || 40, 20);
  const plotL = Math.max(project.plotLength || 30, 20);
  const unit = project.unit || 'feet';

  // Calculate padding and scale to fit nicely with architectural margins
  const margin = Math.min(width, height) * 0.08;
  const availW = width - margin * 2;
  const availH = height - margin * 2 - 80; // space for title block
  const scale = Math.min(availW / plotW, availH / plotL);

  const offsetX = margin + (availW - plotW * scale) / 2;
  const offsetY = margin + (availH - plotL * scale) / 2;

  const toScreenX = (x: number) => offsetX + x * scale;
  const toScreenY = (y: number) => offsetY + y * scale;

  // 1. Subtle CAD Grid
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  const gridStep = scale * 5; // 5 ft / 5 m major grid
  for (let x = offsetX; x <= offsetX + plotW * scale; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, offsetY);
    ctx.lineTo(x, offsetY + plotL * scale);
    ctx.stroke();
  }
  for (let y = offsetY; y <= offsetY + plotL * scale; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(offsetX, y);
    ctx.lineTo(offsetX + plotW * scale, y);
    ctx.stroke();
  }

  // 2. Plot Boundary
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(offsetX, offsetY, plotW * scale, plotL * scale);
  ctx.setLineDash([]);

  // 3. Room Polygons & Floor Materials
  const roomColorMap: Record<string, string> = {
    wood: '#fdf6e2',
    tile: '#e0f2fe',
    marble: '#f1f5f9',
    carpet: '#fef3c7',
    concrete: '#f8fafc',
    paint: '#ecfdf5',
    brick: '#fff7ed'
  };

  project.rooms.forEach(room => {
    if (!room.polygon || room.polygon.length < 3) return;

    ctx.beginPath();
    ctx.moveTo(toScreenX(room.polygon[0].x), toScreenY(room.polygon[0].y));
    for (let i = 1; i < room.polygon.length; i++) {
      ctx.lineTo(toScreenX(room.polygon[i].x), toScreenY(room.polygon[i].y));
    }
    ctx.closePath();

    const floorBg = roomColorMap[room.floorMaterial] || room.floorColor || '#f8fafc';
    ctx.fillStyle = floorBg;
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Room Label & Area
    if (showRoomLabels) {
      const cx = room.polygon.reduce((sum, p) => sum + p.x, 0) / room.polygon.length;
      const cy = room.polygon.reduce((sum, p) => sum + p.y, 0) / room.polygon.length;

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(room.name, toScreenX(cx), toScreenY(cy) - 14);

      ctx.fillStyle = '#059669';
      ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(formatArea(room.area, unit), toScreenX(cx), toScreenY(cy) + 14);
    }
  });

  // 4. Furniture Elements
  if (showFurniture && project.furniture) {
    project.furniture.forEach(item => {
      const sx = toScreenX(item.x);
      const sy = toScreenY(item.y);
      const sw = (item.width || 4) * scale;
      const sl = (item.length || item.height || 4) * scale;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(((item.rotation || 0) * Math.PI) / 180);

      ctx.fillStyle = item.color || '#334155';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(-sw / 2, -sl / 2, sw, sl, 4);
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Furniture Name Tag
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name.slice(0, 10), 0, 0);

      ctx.restore();
    });
  }

  // 5. Walls
  project.walls.forEach(wall => {
    const x1 = toScreenX(wall.start.x);
    const y1 = toScreenY(wall.start.y);
    const x2 = toScreenX(wall.end.x);
    const y2 = toScreenY(wall.end.y);

    const thicknessPx = Math.max(3, (wall.thickness || 0.6) * scale);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = wall.isExterior ? '#0f172a' : '#334155';
    ctx.lineWidth = thicknessPx;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Wall dimension annotation
    if (showDimensions) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 3) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${len.toFixed(1)} ${unit === 'feet' ? 'ft' : 'm'}`, mx, my - 6);
      }
    }
  });

  // 6. Doors
  project.doors.forEach(door => {
    const parentWall = project.walls.find(w => w.id === door.wallId);
    if (!parentWall) return;

    const px = parentWall.start.x + (parentWall.end.x - parentWall.start.x) * door.positionRatio;
    const py = parentWall.start.y + (parentWall.end.y - parentWall.start.y) * door.positionRatio;
    const sx = toScreenX(px);
    const sy = toScreenY(py);
    const doorRadius = (door.width || 3.0) * scale;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(0, 0, doorRadius, 0, Math.PI * 0.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(doorRadius, 0);
    ctx.stroke();

    ctx.restore();
  });

  // 7. Windows
  project.windows.forEach(win => {
    const parentWall = project.walls.find(w => w.id === win.wallId);
    if (!parentWall) return;

    const px = parentWall.start.x + (parentWall.end.x - parentWall.start.x) * win.positionRatio;
    const py = parentWall.start.y + (parentWall.end.y - parentWall.start.y) * win.positionRatio;
    const sx = toScreenX(px);
    const sy = toScreenY(py);
    const winWidthPx = (win.width || 4.0) * scale;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.fillRect(-winWidthPx / 2, -4, winWidthPx, 8);
    ctx.strokeRect(-winWidthPx / 2, -4, winWidthPx, 8);
    ctx.restore();
  });

  // 8. Architectural Title Block Banner (Bottom)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, height - 70, width, 70);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(project.name.toUpperCase(), margin, height - 35);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px monospace';
  ctx.fillText(
    `TYPE: ${project.houseType}  |  PLOT: ${plotW}×${plotL} ${unit.toUpperCase()}  |  SCALE: 1 UNIT = 1 ${unit.toUpperCase()}`,
    margin + 360,
    height - 35
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`DATE: ${new Date().toLocaleDateString()} | 3D HOUSE DESIGNER`, width - margin, height - 35);

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const binaryString = atob(dataUrl.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'image/png' });

  return { dataUrl, blob };
}

/**
 * Capture high-resolution snapshot of active 3D WebGL Canvas.
 */
export function capture3DCanvasSnapshot(): { dataUrl: string; blob: Blob } | null {
  const canvas = document.querySelector('canvas[data-engine="three.js r185"]') as HTMLCanvasElement ||
                 document.querySelector('main canvas') as HTMLCanvasElement;
  if (!canvas) {
    // Try fallback selector
    const anyCanvas = document.querySelectorAll('canvas');
    if (anyCanvas.length > 0) {
      const c = anyCanvas[anyCanvas.length - 1];
      const dataUrl = c.toDataURL('image/png', 1.0);
      const binary = atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return { dataUrl, blob: new Blob([bytes], { type: 'image/png' }) };
    }
    return null;
  }

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const binary = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'image/png' });

  return { dataUrl, blob };
}

export interface PdfExportConfig {
  type: '2d' | '3d' | 'complete';
  pageSize: 'a4' | 'a3';
  orientation: 'portrait' | 'landscape';
  highRes2dDataUrl?: string;
  highRes3dDataUrl?: string;
  additional3dViews?: { label: string; dataUrl: string }[];
}

/**
 * Generates an executive, publication-grade architectural PDF specification
 * conforming strictly to the prompt specifications.
 */
export async function generateComprehensiveProjectPdf(
  project: Project,
  config: PdfExportConfig
): Promise<{ doc: jsPDF; blob: Blob; filename: string }> {
  const {
    type,
    pageSize = 'a4',
    orientation = 'portrait',
    highRes2dDataUrl,
    highRes3dDataUrl,
    additional3dViews = []
  } = config;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const unit = project.unit || 'feet';
  const totalInteriorArea = project.rooms.reduce((acc, r) => acc + (r.area || 0), 0);

  const drawHeaderBanner = (title: string, subtitle: string) => {
    // Top banner
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Accent line
    doc.setFillColor(5, 150, 105); // Emerald-600
    doc.rect(0, 28, pageWidth, 2, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 15);

    // Subtitle & Date
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 22);

    doc.setTextColor(255, 255, 255);
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth - 45, 15);
    doc.setTextColor(52, 211, 153);
    doc.text(`SCALE: 1:100 (${unit.toUpperCase()})`, pageWidth - 45, 22);
  };

  const drawFooter = (pageNo: number, totalPages: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('3D HOUSE FLOOR PLAN DESIGNER  |  CONFIDENTIAL ARCHITECTURAL DOCUMENTATION', 14, pageHeight - 7);
    doc.text(`Page ${pageNo} of ${totalPages}`, pageWidth - 28, pageHeight - 7);
  };

  // ══════════════════════════════════════════════════════════════
  // PAGE 1: Specification Overview & 2D Plan
  // ══════════════════════════════════════════════════════════════
  drawHeaderBanner(
    `PROJECT: ${project.name.toUpperCase()}`,
    `House Type: ${project.houseType}  |  Floors: ${project.floorsCount}  |  Total Rooms: ${project.rooms.length}`
  );

  let currentY = 38;

  // Metadata Card Grid
  const cardW = (pageWidth - 28 - 9) / 4;
  const cardH = 16;
  const metrics = [
    { label: 'PLOT DIMENSIONS', val: `${project.plotWidth} × ${project.plotLength} ${unit}` },
    { label: 'PLOT TOTAL AREA', val: formatArea(project.plotWidth * project.plotLength, unit) },
    { label: 'LIVING INTERIOR AREA', val: formatArea(totalInteriorArea, unit) },
    { label: 'MEASUREMENT UNIT', val: unit.toUpperCase() }
  ];

  metrics.forEach((m, idx) => {
    const cx = 14 + idx * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.rect(cx, currentY, cardW, cardH, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(cx, currentY, cardW, cardH, 'S');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(m.label, cx + 4, currentY + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(m.val, cx + 4, currentY + 12);
  });

  currentY += cardH + 8;

  // Render 2D Plan Section (if 2D or Complete)
  if (type === '2d' || type === 'complete') {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. 2D FLOOR PLAN BLUEPRINT & ROOM LAYOUT', 14, currentY);
    currentY += 4;

    const plan2dUrl = highRes2dDataUrl || generate2DPlanPng(project, { width: 1800, height: 1200 }).dataUrl;
    const imgH = type === '2d' ? (orientation === 'landscape' ? pageHeight - currentY - 20 : 130) : 100;
    const imgW = pageWidth - 28;

    try {
      doc.addImage(plan2dUrl, 'PNG', 14, currentY, imgW, imgH);
      currentY += imgH + 6;
    } catch (e) {
      console.warn('Could not insert 2D image into PDF:', e);
    }
  }

  // If 3D only report, render 3D on Page 1
  if (type === '3d') {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('3D HOUSE MODEL PERSPECTIVE RENDER', 14, currentY);
    currentY += 4;

    const img3d = highRes3dDataUrl || capture3DCanvasSnapshot()?.dataUrl;
    const imgH = orientation === 'landscape' ? pageHeight - currentY - 20 : 135;
    const imgW = pageWidth - 28;

    if (img3d) {
      try {
        doc.addImage(img3d, 'PNG', 14, currentY, imgW, imgH);
        currentY += imgH + 6;
      } catch (e) {
        console.warn('Could not insert 3D render image into PDF:', e);
      }
    }
  }

  // Room specification table on page 1 (if 2D with space) or page 2
  if (type === '2d' && currentY + 45 < pageHeight) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ROOM SPECIFICATIONS SCHEDULE', 14, currentY);
    currentY += 4;

    // Table header
    doc.setFillColor(30, 41, 59);
    doc.rect(14, currentY, pageWidth - 28, 6.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ROOM NAME', 18, currentY + 4.5);
    doc.text('CATEGORY / TYPE', 70, currentY + 4.5);
    doc.text('FLOOR MATERIAL', 120, currentY + 4.5);
    doc.text('AREA', pageWidth - 35, currentY + 4.5);
    currentY += 6.5;

    project.rooms.slice(0, 6).forEach((room, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(14, currentY, pageWidth - 28, 5.5, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(room.name, 18, currentY + 4);
      doc.text(room.type, 70, currentY + 4);
      doc.text(String(room.floorMaterial).toUpperCase(), 120, currentY + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(formatArea(room.area, unit), pageWidth - 35, currentY + 4);
      currentY += 5.5;
    });
  }

  drawFooter(1, type === 'complete' ? 2 : 1);

  // ══════════════════════════════════════════════════════════════
  // PAGE 2: 3D Views & Architectural Schedule (for Complete Export)
  // ══════════════════════════════════════════════════════════════
  if (type === 'complete') {
    doc.addPage(pageSize, orientation);
    drawHeaderBanner(
      `PROJECT: ${project.name.toUpperCase()} — 3D VIEWS & SCHEDULE`,
      `Verified 3D Architectural Model and Room Schedules`
    );

    let page2Y = 38;

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. 3D HOUSE MODEL VIEWS', 14, page2Y);
    page2Y += 5;

    // Primary 3D Snapshot
    const primary3d = highRes3dDataUrl || capture3DCanvasSnapshot()?.dataUrl;
    const viewWidth = (pageWidth - 28 - 8) / 2;
    const viewHeight = 65;

    if (primary3d) {
      try {
        doc.addImage(primary3d, 'PNG', 14, page2Y, viewWidth, viewHeight);
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('Perspective Walkthrough View', 14, page2Y + viewHeight + 4);
      } catch (e) {}
    }

    // Secondary 3D or Top View
    const secondary3d = additional3dViews[0]?.dataUrl || primary3d;
    if (secondary3d) {
      try {
        doc.addImage(secondary3d, 'PNG', 14 + viewWidth + 8, page2Y, viewWidth, viewHeight);
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(additional3dViews[0]?.label || 'Orthographic Overhead View', 14 + viewWidth + 8, page2Y + viewHeight + 4);
      } catch (e) {}
    }

    page2Y += viewHeight + 12;

    // Room Specification Table (Complete breakdown)
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('3. COMPLETE ROOM SPECIFICATIONS & AREA BREAKDOWN', 14, page2Y);
    page2Y += 5;

    // Table Header
    doc.setFillColor(15, 23, 42);
    doc.rect(14, page2Y, pageWidth - 28, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ROOM NAME', 18, page2Y + 4.8);
    doc.text('CATEGORY', 60, page2Y + 4.8);
    doc.text('FLOOR FINISH', 105, page2Y + 4.8);
    doc.text('WALL FINISH', 145, page2Y + 4.8);
    doc.text('AREA', pageWidth - 32, page2Y + 4.8);
    page2Y += 7;

    project.rooms.forEach((room, idx) => {
      if (page2Y > pageHeight - 25) return;
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(14, page2Y, pageWidth - 28, 6, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(room.name, 18, page2Y + 4.2);
      doc.text(room.type, 60, page2Y + 4.2);
      doc.text(String(room.floorMaterial).toUpperCase(), 105, page2Y + 4.2);
      doc.text(String(room.wallMaterial || 'paint').toUpperCase(), 145, page2Y + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.text(formatArea(room.area, unit), pageWidth - 32, page2Y + 4.2);
      page2Y += 6;
    });

    // Summary Row
    doc.setFillColor(236, 253, 245);
    doc.rect(14, page2Y, pageWidth - 28, 7, 'F');
    doc.setTextColor(6, 95, 70);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL INTERIOR LIVING AREA', 18, page2Y + 4.8);
    doc.text(formatArea(totalInteriorArea, unit), pageWidth - 32, page2Y + 4.8);

    drawFooter(2, 2);
  }

  const pdfOutput = doc.output('blob');
  const filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_${type === 'complete' ? 'complete_project' : type + '_report'}.pdf`;

  return { doc, blob: pdfOutput, filename };
}

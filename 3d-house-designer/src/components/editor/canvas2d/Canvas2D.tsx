import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProject } from '../../../context/ProjectContext';
import { Point2D, Wall } from '../../../types/floorplan';
import {
  distance2D,
  angle2D,
  snapPointToGrid,
  findClosestWall,
  getPolygonCenter,
  calculateOverlayBounds
} from '../../../utils/geometry';
import { formatLength, formatArea } from '../../../utils/unitConverter';
import {
  FileUp,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  CheckCircle,
  Move,
  Sparkles
} from 'lucide-react';
import { Convert2Dto3DModal } from '../converter/Convert2Dto3DModal';
import { CanvasFloatingControls } from './CanvasFloatingControls';
import { ScaleCalibrationModal } from './ScaleCalibrationModal';
import { ValidationPanel } from './ValidationPanel';
import { PlanUploaderModal } from '../../upload/PlanUploaderModal';
import { StepIndicator } from '../toolbar/StepIndicator';
import { validateFloorPlan, autoFixValidationIssues } from '../../../utils/floorplanValidation';
import { WorkflowStep, ValidationIssue } from '../../../types/floorplan';
import { Ruler, ShieldAlert } from 'lucide-react';

export const Canvas2D: React.FC = () => {
  const {
    currentProject,
    toolMode,
    setToolMode,
    selectedFurnitureCatalogId,
    selectedElement,
    setSelectedElement,
    addWall,
    addDoor,
    addWindow,
    addFurniture,
    updateFurniture,
    applyConvertedFloorPlan,
    showGrid,
    snapGrid,
    gridSize,
    setBlueprintOverlay,
    updateBlueprintOverlay,
    importProjectJSON,
    setActiveView
  } = useProject();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(14); // pixels per foot/meter unit
  const [pan, setPan] = useState<Point2D>({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<Point2D>({ x: 0, y: 0 });

  // Drawing state
  const [wallStart, setWallStart] = useState<Point2D | null>(null);
  const [mouseWorld, setMouseWorld] = useState<Point2D>({ x: 0, y: 0 });
  const [hoveredWall, setHoveredWall] = useState<{ wall: Wall; ratio: number; point: Point2D } | null>(null);
  const [draggingFurnitureId, setDraggingFurnitureId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point2D>({ x: 0, y: 0 });

  // Scale Calibration State
  const [scaleP1, setScaleP1] = useState<Point2D | null>(null);
  const [scaleP2, setScaleP2] = useState<Point2D | null>(null);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState<boolean>(false);

  // 2D Validation State
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isValidationOpen, setIsValidationOpen] = useState<boolean>(false);

  // 2D Blueprint Overlay & File Upload State
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [showOverlayControls, setShowOverlayControls] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false);
  const [isUploaderModalOpen, setIsUploaderModalOpen] = useState<boolean>(false);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('edit2d');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const overlayImgRef = useRef<HTMLImageElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Convert screen canvas coordinates to world units (ft/m)
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point2D => {
      const x = (screenX - pan.x) / zoom;
      const y = (screenY - pan.y) / zoom;
      if (snapGrid) {
        return snapPointToGrid({ x, y }, gridSize);
      }
      return { x, y };
    },
    [pan, zoom, snapGrid, gridSize]
  );

  // Convert world units to screen coordinates
  const worldToScreen = useCallback(
    (worldX: number, worldY: number): Point2D => {
      return {
        x: worldX * zoom + pan.x,
        y: worldY * zoom + pan.y
      };
    },
    [pan, zoom]
  );

  // Fit canvas to container size
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load blueprint image whenever overlay image URL changes
  useEffect(() => {
    const imageUrl = currentProject?.blueprintOverlay?.imageUrl;
    if (!imageUrl) {
      overlayImgRef.current = null;
      renderCanvas();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      overlayImgRef.current = img;
      renderCanvas();
    };
    img.onerror = () => {
      console.warn('Failed to load blueprint overlay image.');
      overlayImgRef.current = null;
    };
    img.src = imageUrl;
  }, [currentProject?.blueprintOverlay?.imageUrl]);

  const handleFitToPlot = () => {
    if (!currentProject || !overlayImgRef.current) return;
    const plotW = currentProject.plotWidth || 40;
    const plotL = currentProject.plotLength || 30;
    const img = overlayImgRef.current;
    const bounds = calculateOverlayBounds(img.naturalWidth || 1, img.naturalHeight || 1, plotW, plotL);

    updateBlueprintOverlay({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    });
  };

  const handleScaleOverlay = (factor: number) => {
    if (!currentProject?.blueprintOverlay) return;
    const { width: bw, height: bh, x, y } = currentProject.blueprintOverlay;
    const newW = Math.max(2, bw * factor);
    const newH = Math.max(2, bh * factor);
    const newX = x - (newW - bw) / 2;
    const newY = y - (newH - bh) / 2;
    updateBlueprintOverlay({
      width: Math.round(newW * 10) / 10,
      height: Math.round(newH * 10) / 10,
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10
    });
  };

  const handleProcessFile = (file: File) => {
    if (!currentProject) return;

    // 1. JSON Floorplan Project file
    if (file.name.endsWith('.json') || file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        if (content) {
          const success = importProjectJSON(content);
          if (success) {
            showToast(`Loaded project from "${file.name}"`);
          } else {
            alert('Could not parse floorplan JSON file.');
          }
        }
      };
      reader.readAsText(file);
      return;
    }

    // 2. Blueprint Reference Image (PNG, JPG, SVG, WebP)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const testImg = new Image();
          testImg.onload = () => {
            const plotW = currentProject.plotWidth || 40;
            const plotL = currentProject.plotLength || 30;
            const bounds = calculateOverlayBounds(testImg.naturalWidth || 1, testImg.naturalHeight || 1, plotW, plotL);

            setBlueprintOverlay({
              imageUrl: dataUrl,
              opacity: 0.5,
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
              visible: true
            });

            setShowOverlayControls(true);
            showToast('2D Blueprint loaded! Opening 3D auto-converter...');
            setTimeout(() => {
              setIsConvertModalOpen(true);
            }, 700);
          };
          testImg.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    alert('Please upload an image (PNG, JPG, SVG, WebP) or a floorplan JSON file.');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Main 2D Canvas Render Loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentProject) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background - Architectural Clean White Canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 0.5. Draw Blueprint Reference Overlay (if uploaded & visible)
    if (currentProject.blueprintOverlay?.visible && overlayImgRef.current) {
      const { x, y, width: bw, height: bh, opacity } = currentProject.blueprintOverlay;
      const screenTL = worldToScreen(x, y);
      const screenBR = worldToScreen(x + bw, y + bh);
      const screenW = screenBR.x - screenTL.x;
      const screenH = screenBR.y - screenTL.y;

      ctx.save();
      ctx.globalAlpha = Math.max(0.05, Math.min(1.0, opacity));
      try {
        ctx.drawImage(overlayImgRef.current, screenTL.x, screenTL.y, screenW, screenH);
      } catch (err) {
        console.warn('Failed to draw blueprint overlay image', err);
      }

      // Blueprint outline border
      ctx.globalAlpha = Math.min(0.9, opacity + 0.2);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(screenTL.x, screenTL.y, screenW, screenH);
      ctx.restore();
    }

    // 1. Draw Architectural CAD Grid
    if (showGrid) {
      const startWorld = screenToWorld(0, 0);
      const endWorld = screenToWorld(width, height);

      const step = 5; // 5ft or 5m grid lines
      const minX = Math.floor(startWorld.x / step) * step;
      const maxX = Math.ceil(endWorld.x / step) * step;
      const minY = Math.floor(startWorld.y / step) * step;
      const maxY = Math.ceil(endWorld.y / step) * step;

      for (let x = minX; x <= maxX; x += step) {
        const s = worldToScreen(x, 0);
        const isMajor = x % 25 === 0;
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.strokeStyle = isMajor ? '#a7f3d0' : '#f1f5f9';
        ctx.beginPath();
        ctx.moveTo(s.x, 0);
        ctx.lineTo(s.x, height);
        ctx.stroke();
      }

      for (let y = minY; y <= maxY; y += step) {
        const s = worldToScreen(0, y);
        const isMajor = y % 25 === 0;
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.strokeStyle = isMajor ? '#a7f3d0' : '#f1f5f9';
        ctx.beginPath();
        ctx.moveTo(0, s.y);
        ctx.lineTo(width, s.y);
        ctx.stroke();
      }
    }

    // 2. Draw Plot Perimeter Boundary
    const plotTL = worldToScreen(0, 0);
    const plotBR = worldToScreen(currentProject.plotWidth, currentProject.plotLength);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#059669';
    ctx.strokeRect(plotTL.x, plotTL.y, plotBR.x - plotTL.x, plotBR.y - plotTL.y);
    ctx.setLineDash([]);

    // Plot Title badge with exact dimensions and square footage
    ctx.font = 'bold 12px Inter, monospace';
    ctx.fillStyle = '#047857';
    ctx.fillText(
      `FLOOR PLAN: ${currentProject.plotWidth} ${currentProject.unit} × ${currentProject.plotLength} ${currentProject.unit} · ${(currentProject.plotWidth * currentProject.plotLength).toLocaleString()} sq.${currentProject.unit === 'feet' ? 'ft' : 'm'}`,
      plotTL.x + 8,
      plotTL.y - 10
    );

    // 3. Draw Rooms (Polygons + Area Labels)
    currentProject.rooms.forEach(room => {
      if (!room.polygon || room.polygon.length < 3) return;

      ctx.beginPath();
      const first = worldToScreen(room.polygon[0].x, room.polygon[0].y);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < room.polygon.length; i++) {
        const pt = worldToScreen(room.polygon[i].x, room.polygon[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      // Selected highlight
      const isSelected = selectedElement?.id === room.id;
      ctx.fillStyle = isSelected ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.08)';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#059669' : '#cbd5e1';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Room Center Label
      const centerWorld = getPolygonCenter(room.polygon);
      const centerScreen = worldToScreen(centerWorld.x, centerWorld.y);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, centerScreen.x, centerScreen.y - 5);

      ctx.fillStyle = '#047857';
      ctx.font = '600 11px Inter, monospace';
      ctx.fillText(formatArea(room.area, currentProject.unit), centerScreen.x, centerScreen.y + 11);
    });

    // 4. Draw Solid Walls
    currentProject.walls.forEach(wall => {
      const s1 = worldToScreen(wall.start.x, wall.start.y);
      const s2 = worldToScreen(wall.end.x, wall.end.y);

      const isSelected = selectedElement?.id === wall.id;
      const wallPxThickness = Math.max(4, wall.thickness * zoom);

      ctx.lineWidth = wallPxThickness;
      ctx.lineCap = 'square';
      ctx.strokeStyle = isSelected ? '#059669' : wall.isExterior ? '#0f172a' : '#475569';
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();

      // Dimension Line & Label
      const wallLen = distance2D(wall.start, wall.end);
      const midWorld = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 };
      const midScreen = worldToScreen(midWorld.x, midWorld.y);

      // Dimension badge
      ctx.fillStyle = isSelected ? '#059669' : '#047857';
      ctx.font = 'bold 11px Inter, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(formatLength(wallLen, currentProject.unit), midScreen.x, midScreen.y - (wallPxThickness / 2 + 5));
    });

    // 5. Draw Doors on Walls
    currentProject.doors.forEach(door => {
      const wall = currentProject.walls.find(w => w.id === door.wallId);
      if (!wall) return;

      const doorWorldX = wall.start.x + door.positionRatio * (wall.end.x - wall.start.x);
      const doorWorldY = wall.start.y + door.positionRatio * (wall.end.y - wall.start.y);
      const p = worldToScreen(doorWorldX, doorWorldY);

      const isSelected = selectedElement?.id === door.id;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle2D(wall.start, wall.end));

      const doorPxW = door.width * zoom;
      ctx.fillStyle = isSelected ? '#10b981' : '#b45309';
      ctx.fillRect(-doorPxW / 2, -6, doorPxW, 12);

      // Swing arc
      ctx.beginPath();
      ctx.arc(-doorPxW / 2, -6, doorPxW, 0, -Math.PI / 2, true);
      ctx.strokeStyle = '#d97706';
      ctx.setLineDash([3, 3]);
      ctx.stroke();

      ctx.restore();
    });

    // 6. Draw Windows on Walls with Architectural Blueprint Detailing
    currentProject.windows.forEach(win => {
      const wall = currentProject.walls.find(w => w.id === win.wallId);
      if (!wall) return;

      const winWorldX = wall.start.x + win.positionRatio * (wall.end.x - wall.start.x);
      const winWorldY = wall.start.y + win.positionRatio * (wall.end.y - wall.start.y);
      const p = worldToScreen(winWorldX, winWorldY);

      const isSelected = selectedElement?.id === win.id;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle2D(wall.start, wall.end));

      const winPxW = Math.max(16, win.width * zoom);
      const wallPxThick = Math.max(8, (wall.thickness || 0.6) * zoom);

      // 1. Clear out wall core for window rough opening
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-winPxW / 2, -wallPxThick / 2, winPxW, wallPxThick);

      // 2. Wall jamb end lines (cutout boundary)
      ctx.strokeStyle = isSelected ? '#10b981' : '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-winPxW / 2, -wallPxThick / 2);
      ctx.lineTo(-winPxW / 2, wallPxThick / 2);
      ctx.moveTo(winPxW / 2, -wallPxThick / 2);
      ctx.lineTo(winPxW / 2, wallPxThick / 2);
      ctx.stroke();

      // 3. Projecting exterior sill (authentic CAD architectural window sill)
      ctx.strokeStyle = isSelected ? '#10b981' : '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-winPxW / 2 - 3, wallPxThick / 2 + 2.5);
      ctx.lineTo(winPxW / 2 + 3, wallPxThick / 2 + 2.5);
      ctx.stroke();

      // 4. Double glazing architectural glass lines
      ctx.strokeStyle = isSelected ? '#059669' : '#0284c7';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      // Glazing pane 1
      ctx.moveTo(-winPxW / 2 + 2, -wallPxThick * 0.16);
      ctx.lineTo(winPxW / 2 - 2, -wallPxThick * 0.16);
      // Glazing pane 2
      ctx.moveTo(-winPxW / 2 + 2, wallPxThick * 0.16);
      ctx.lineTo(winPxW / 2 - 2, wallPxThick * 0.16);
      ctx.stroke();

      // 5. Center mullion / sash divider
      ctx.fillStyle = isSelected ? '#10b981' : '#0284c7';
      ctx.fillRect(-2, -wallPxThick / 2 + 1, 4, wallPxThick - 2);

      // 6. Selection highlight glow
      if (isSelected) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(-winPxW / 2 - 4, -wallPxThick / 2 - 4, winPxW + 8, wallPxThick + 8);
      }

      ctx.restore();
    });

    // 7. Draw Furniture
    currentProject.furniture.forEach(item => {
      const p = worldToScreen(item.x, item.y);
      const wPx = item.width * zoom;
      const lPx = item.length * zoom;
      const isSelected = selectedElement?.id === item.id;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((item.rotation * Math.PI) / 180);

      // Body box
      ctx.fillStyle = item.color || '#059669';
      ctx.fillRect(-wPx / 2, -lPx / 2, wPx, lPx);

      // Selection outline
      if (isSelected) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-wPx / 2 - 3, -lPx / 2 - 3, wPx + 6, lPx + 6);

        // Rotation handle dot
        ctx.beginPath();
        ctx.arc(0, -lPx / 2 - 14, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-wPx / 2, -lPx / 2, wPx, lPx);
      }

      // Name text
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, 0, 3);

      ctx.restore();
    });

    // 8. Rubber-band Wall Drawing Preview
    if (toolMode === 'wall' && wallStart) {
      const s1 = worldToScreen(wallStart.x, wallStart.y);
      const s2 = worldToScreen(mouseWorld.x, mouseWorld.y);

      ctx.lineWidth = 6;
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();

      const drawLen = distance2D(wallStart, mouseWorld);
      ctx.fillStyle = '#059669';
      ctx.font = '700 13px Inter, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(formatLength(drawLen, currentProject.unit), (s1.x + s2.x) / 2, (s1.y + s2.y) / 2 - 12);
    }

    // 9. Door/Window Placement Snap Preview
    if ((toolMode === 'door' || toolMode === 'window') && hoveredWall) {
      const snapP = worldToScreen(hoveredWall.point.x, hoveredWall.point.y);
      ctx.beginPath();
      ctx.arc(snapP.x, snapP.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = toolMode === 'door' ? '#f59e0b' : '#059669';
      ctx.fill();
    }
  }, [
    currentProject,
    showGrid,
    selectedElement,
    toolMode,
    wallStart,
    mouseWorld,
    hoveredWall,
    zoom,
    pan,
    screenToWorld,
    worldToScreen
  ]);

  // Request Animation Frame loop
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentProject) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);

    // Right-click or Middle-click or Shift key for panning
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: screenX - pan.x, y: screenY - pan.y });
      return;
    }

    if (toolMode === 'select') {
      // 1. Check Furniture click
      const clickedFurniture = currentProject.furniture.find(f => {
        const dx = Math.abs(world.x - f.x);
        const dy = Math.abs(world.y - f.y);
        return dx <= f.width / 2 && dy <= f.length / 2;
      });

      if (clickedFurniture) {
        setSelectedElement({ id: clickedFurniture.id, type: 'furniture' });
        setDraggingFurnitureId(clickedFurniture.id);
        setDragOffset({ x: world.x - clickedFurniture.x, y: world.y - clickedFurniture.y });
        return;
      }

      // 2. Check Door click
      const clickedDoor = currentProject.doors.find(d => {
        const wall = currentProject.walls.find(w => w.id === d.wallId);
        if (!wall) return false;
        const doorX = wall.start.x + d.positionRatio * (wall.end.x - wall.start.x);
        const doorY = wall.start.y + d.positionRatio * (wall.end.y - wall.start.y);
        return distance2D(world, { x: doorX, y: doorY }) <= d.width / 2;
      });

      if (clickedDoor) {
        setSelectedElement({ id: clickedDoor.id, type: 'door' });
        return;
      }

      // 3. Check Window click
      const clickedWindow = currentProject.windows.find(win => {
        const wall = currentProject.walls.find(w => w.id === win.wallId);
        if (!wall) return false;
        const winX = wall.start.x + win.positionRatio * (wall.end.x - wall.start.x);
        const winY = wall.start.y + win.positionRatio * (wall.end.y - wall.start.y);
        return distance2D(world, { x: winX, y: winY }) <= win.width / 2;
      });

      if (clickedWindow) {
        setSelectedElement({ id: clickedWindow.id, type: 'window' });
        return;
      }

      // 4. Check Wall click
      const wallHit = findClosestWall(world, currentProject.walls, 1.2);
      if (wallHit) {
        setSelectedElement({ id: wallHit.wall.id, type: 'wall' });
        return;
      }

      // 5. Check Room click
      const clickedRoom = currentProject.rooms.find(r => {
        const center = getPolygonCenter(r.polygon);
        return distance2D(world, center) <= 5.0;
      });

      if (clickedRoom) {
        setSelectedElement({ id: clickedRoom.id, type: 'room' });
        return;
      }

      setSelectedElement(null);
    } else if (toolMode === 'scale') {
      if (!scaleP1) {
        setScaleP1(world);
      } else {
        setScaleP2(world);
        setIsScaleModalOpen(true);
      }
    } else if (toolMode === 'wall') {
      if (!wallStart) {
        setWallStart(world);
      } else {
        if (distance2D(wallStart, world) > 0.5) {
          addWall(wallStart, world);
        }
        setWallStart(null);
      }
    } else if (toolMode === 'door' && hoveredWall) {
      addDoor(hoveredWall.wall.id, hoveredWall.ratio);
    } else if (toolMode === 'window' && hoveredWall) {
      addWindow(hoveredWall.wall.id, hoveredWall.ratio);
    } else if (toolMode === 'furniture' && selectedFurnitureCatalogId) {
      addFurniture(selectedFurnitureCatalogId, world.x, world.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentProject) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isPanning) {
      setPan({ x: screenX - panStart.x, y: screenY - panStart.y });
      return;
    }

    const world = screenToWorld(screenX, screenY);
    setMouseWorld(world);

    // Furniture dragging
    if (draggingFurnitureId) {
      updateFurniture(draggingFurnitureId, {
        x: world.x - dragOffset.x,
        y: world.y - dragOffset.y
      });
      return;
    }

    // Door / Window placement snap preview
    if (toolMode === 'door' || toolMode === 'window') {
      const hit = findClosestWall(world, currentProject.walls, 2.5);
      setHoveredWall(hit);
    } else {
      setHoveredWall(null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingFurnitureId(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(prev => Math.min(60, Math.max(4, prev * zoomFactor)));
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-full overflow-hidden bg-white select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
        className="block cursor-crosshair w-full h-full"
      />

      {/* Hidden File Input for 2D Uploads (Blueprints or JSON) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.json"
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            handleProcessFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Drag & Drop Visual Dropzone Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md border-4 border-dashed border-emerald-500 m-4 rounded-3xl flex flex-col items-center justify-center pointer-events-none transition-all shadow-2xl">
          <div className="p-5 bg-emerald-100 text-emerald-700 rounded-2xl mb-4 border border-emerald-400 animate-bounce">
            <FileUp size={52} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-1.5">Drop File into 2D Canvas</h3>
          <p className="text-xs text-slate-600 max-w-sm text-center font-medium">
            Drop a 2D blueprint / floor plan image (PNG, JPG, SVG, WebP) to trace over, or a project JSON file to import.
          </p>
        </div>
      )}

      {/* Floating Blueprint Upload Button / Control Panel (Top-Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        {!currentProject?.blueprintOverlay ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl shadow-md backdrop-blur-md transition group text-xs font-semibold cursor-pointer"
              title="Upload 2D Blueprint (PNG, JPG, SVG, WebP) or floorplan JSON"
            >
              <FileUp size={14} className="text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>Upload Blueprint</span>
            </button>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-md border border-emerald-100 rounded-2xl p-3 text-xs shadow-2xl w-72 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                <ImageIcon size={15} className="text-emerald-600" />
                <span>2D Blueprint Overlay</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateBlueprintOverlay({ visible: !currentProject.blueprintOverlay?.visible })}
                  className={`p-1.5 rounded-lg transition ${
                    currentProject.blueprintOverlay?.visible
                      ? 'text-emerald-600 hover:bg-emerald-50'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                  title={currentProject.blueprintOverlay?.visible ? 'Hide Blueprint' : 'Show Blueprint'}
                >
                  {currentProject.blueprintOverlay?.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => setBlueprintOverlay(null)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                  title="Remove Blueprint Overlay"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {currentProject.blueprintOverlay?.visible && (
              <div className="space-y-3">
                {/* 2D to 3D Extruder Button */}
                <button
                  onClick={() => setIsConvertModalOpen(true)}
                  className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition text-xs transform active:scale-98 cursor-pointer"
                  title="Auto-generate 3D walls, rooms, and house model from this blueprint"
                >
                  <Sparkles size={14} className="text-amber-300 animate-pulse" />
                  <span>Convert Blueprint to 3D</span>
                </button>
                {/* Opacity Control */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Sliders size={11} /> Trace Opacity
                    </span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {Math.round((currentProject.blueprintOverlay.opacity || 0.5) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={currentProject.blueprintOverlay.opacity || 0.5}
                    onChange={e => updateBlueprintOverlay({ opacity: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Scale & Fit Actions */}
                <div>
                  <div className="text-[11px] text-slate-500 mb-1.5">Scale & Fit</div>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    <button
                      onClick={() => handleScaleOverlay(0.9)}
                      className="py-1 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold text-center flex items-center justify-center gap-1 transition"
                      title="Scale down 10%"
                    >
                      <ZoomOut size={12} />
                      <span>-10%</span>
                    </button>
                    <button
                      onClick={() => handleScaleOverlay(1.1)}
                      className="py-1 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold text-center flex items-center justify-center gap-1 transition"
                      title="Scale up 10%"
                    >
                      <ZoomIn size={12} />
                      <span>+10%</span>
                    </button>
                    <button
                      onClick={handleFitToPlot}
                      className="py-1 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-800 font-semibold text-center flex items-center justify-center gap-1 transition"
                      title="Fit blueprint to plot perimeter"
                    >
                      <Maximize2 size={12} />
                      <span>Fit Plot</span>
                    </button>
                  </div>
                </div>

                {/* Nudge / Shift Position */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Move size={11} /> Nudge Position ({currentProject.unit})
                    </span>
                    <button
                      onClick={() => updateBlueprintOverlay({ x: 0, y: 0 })}
                      className="text-[10px] text-emerald-700 font-semibold hover:underline"
                    >
                      Reset (0,0)
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      onClick={() => updateBlueprintOverlay({ x: (currentProject.blueprintOverlay?.x || 0) - 1 })}
                      className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold transition text-center"
                      title="Move left 1 unit"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => updateBlueprintOverlay({ x: (currentProject.blueprintOverlay?.x || 0) + 1 })}
                      className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold transition text-center"
                      title="Move right 1 unit"
                    >
                      →
                    </button>
                    <button
                      onClick={() => updateBlueprintOverlay({ y: (currentProject.blueprintOverlay?.y || 0) - 1 })}
                      className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold transition text-center"
                      title="Move up 1 unit"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => updateBlueprintOverlay({ y: (currentProject.blueprintOverlay?.y || 0) + 1 })}
                      className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold transition text-center"
                      title="Move down 1 unit"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                {/* Change Blueprint / Trace Tip */}
                <div className="pt-1.5 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold"
                  >
                    <FileUp size={12} />
                    <span>Change File</span>
                  </button>
                  <span className="text-[10px] text-slate-400 italic">Trace with Wall tool</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-emerald-600 text-white font-semibold text-xs px-4 py-2 rounded-full shadow-2xl border border-emerald-500 backdrop-blur-md transition">
          <CheckCircle size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Step Indicator & Validation Controls - Top Center */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <StepIndicator
          currentStep={workflowStep}
          onSelectStep={step => {
            setWorkflowStep(step);
            if (step === 'upload') {
              setIsUploaderModalOpen(true);
            } else if (step === 'analyze' || step === 'generate3d' || step === 'interior') {
              setActiveView('3D');
            }
          }}
        />

        <button
          onClick={() => {
            if (!currentProject) return;
            const issues = validateFloorPlan(
              currentProject.walls,
              currentProject.rooms,
              currentProject.doors,
              currentProject.windows
            );
            setValidationIssues(issues);
            setIsValidationOpen(true);
            if (issues.length === 0) {
              showToast('✓ 2D Floor Plan is valid & ready for 3D generation!');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-xl shadow-xs text-xs font-semibold cursor-pointer"
          title="Validate 2D Floor Plan geometry before 3D generation"
        >
          <ShieldAlert size={14} className="text-amber-600" />
          <span>Validate 2D</span>
        </button>

        <button
          onClick={() => setToolMode('scale')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl shadow-xs text-xs font-semibold cursor-pointer transition ${
            toolMode === 'scale'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
          title="Calibrate pixels to real-world units (feet/meters)"
        >
          <Ruler size={14} className={toolMode === 'scale' ? 'text-white' : 'text-emerald-600'} />
          <span>Set Scale</span>
        </button>
      </div>

      {/* Floating Canvas Controls */}
      <CanvasFloatingControls
        zoom={zoom}
        onZoomIn={() => setZoom(z => Math.min(60, z + 2))}
        onZoomOut={() => setZoom(z => Math.max(4, z - 2))}
        onFitToScreen={() => setZoom(14)}
      />

      {toolMode === 'scale' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-emerald-600 text-white font-semibold text-xs px-5 py-2 rounded-full shadow-2xl border border-emerald-400 animate-bounce">
          {!scaleP1 ? 'Click 1st Point on Floor Plan' : 'Click 2nd Point to Measure Real Distance'}
        </div>
      )}

      {wallStart && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-emerald-600 text-white font-semibold text-xs px-4 py-1.5 rounded-full shadow-lg border border-emerald-500 animate-pulse">
          Drawing Wall: Click to set endpoint (Esc to cancel)
        </div>
      )}

      {/* 2D Validation Panel */}
      <ValidationPanel
        isOpen={isValidationOpen}
        issues={validationIssues}
        onClose={() => setIsValidationOpen(false)}
        onAutoFix={() => {
          if (!currentProject) return;
          const result = autoFixValidationIssues(
            validationIssues,
            currentProject.walls,
            currentProject.rooms,
            currentProject.doors,
            currentProject.windows
          );
          applyConvertedFloorPlan(
            result.fixedWalls,
            result.fixedRooms,
            result.fixedDoors,
            result.fixedWindows,
            undefined,
            false
          );
          setValidationIssues([]);
          setIsValidationOpen(false);
          showToast(`Fixed ${result.fixedCount} floor plan issues automatically!`);
        }}
      />

      {/* Interactive Scale Calibration Modal */}
      <ScaleCalibrationModal
        isOpen={isScaleModalOpen}
        onClose={() => {
          setIsScaleModalOpen(false);
          setScaleP1(null);
          setScaleP2(null);
          setToolMode('select');
        }}
        p1={scaleP1}
        p2={scaleP2}
        currentUnit={currentProject?.unit || 'feet'}
        pixelDistance={scaleP1 && scaleP2 ? distance2D(scaleP1, scaleP2) * zoom : 100}
        onApplyScale={(realDist, unit, pxPerUnit) => {
          if (currentProject?.blueprintOverlay) {
            updateBlueprintOverlay({ scalePixelsPerUnit: pxPerUnit });
          }
          showToast(`Scale calibrated: 1 ${unit} = ${Math.round(pxPerUnit * 10) / 10} px`);
          setToolMode('select');
          setScaleP1(null);
          setScaleP2(null);
        }}
      />

      {/* Full Multi-Stage Plan Uploader Modal */}
      <PlanUploaderModal
        isOpen={isUploaderModalOpen}
        onClose={() => setIsUploaderModalOpen(false)}
        createNewProjectOnUpload={false}
        initialTargetView="2D"
        onPlanLoadedAndProcessed={() => {
          showToast('Floor plan loaded & structured 2D model generated!');
          setWorkflowStep('edit2d');
        }}
      />

      {/* 2D to 3D Blueprint Auto-Conversion Studio Modal */}
      <Convert2Dto3DModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
      />
    </div>
  );
};

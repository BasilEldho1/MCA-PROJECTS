import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { validateUploadedFloorPlanFile } from '../../services/imagePreprocessing';
import { analyzeBlueprintWithAI } from '../../utils/detection/aiBlueprintAnalyzer';
import { renderPdfFloorPlanToCanvas } from '../../utils/pdfPlanExtractor';
import { calculateOverlayBounds } from '../../utils/geometry';
import { DimensionReviewScreen } from '../editor/converter/DimensionReviewScreen';
import { ProcessingStage, Wall, Room, Door, WindowItem } from '../../types/floorplan';
import confetti from 'canvas-confetti';
import {
  FileUp,
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Image as ImageIcon,
  Sparkles,
  Box,
  Layers,
  ArrowRight,
  Zap,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sliders,
  Check,
  Loader2
} from 'lucide-react';

interface PlanUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanLoadedAndProcessed?: (result?: { projectId: string; targetView: '2D' | '3D' }) => void;
  createNewProjectOnUpload?: boolean;
  initialTargetView?: '2D' | '3D';
}

function generateSampleBlueprintDataUrl(name: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 650;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Technical blueprint blueprint styling
  ctx.fillStyle = '#0f2438';
  ctx.fillRect(0, 0, 900, 650);

  // CAD Grid lines
  ctx.strokeStyle = '#183857';
  ctx.lineWidth = 1;
  for (let x = 0; x < 900; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 650);
    ctx.stroke();
  }
  for (let y = 0; y < 650; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(900, y);
    ctx.stroke();
  }

  // Outer load-bearing perimeter walls
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(90, 80, 720, 480);

  // Interior dividing walls
  ctx.lineWidth = 5;
  ctx.beginPath();
  // Vertical partition
  ctx.moveTo(450, 80);
  ctx.lineTo(450, 560);
  // Left room split
  ctx.moveTo(90, 320);
  ctx.lineTo(450, 320);
  // Right room split
  ctx.moveTo(450, 300);
  ctx.lineTo(810, 300);
  ctx.stroke();

  // Doors / window cutouts accent
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(450, 240, 28, 0, Math.PI * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(380, 320, 28, 0, Math.PI * 0.5);
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#7dd3fc';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('LIVING & DINING', 180, 210);
  ctx.fillText('MASTER BEDROOM', 180, 450);
  ctx.fillText('KITCHEN', 580, 200);
  ctx.fillText('GUEST BEDROOM', 560, 440);

  // Blueprint title block
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`ARCHITECTURAL PLAN: ${name.toUpperCase()}`, 100, 50);
  ctx.font = '12px monospace';
  ctx.fillText('SCALE: 1/4" = 1\'0" • AUTODETECT COMPLIANT', 520, 50);

  return canvas.toDataURL('image/png');
}

export const PlanUploaderModal: React.FC<PlanUploaderModalProps> = ({
  isOpen,
  onClose,
  onPlanLoadedAndProcessed,
  createNewProjectOnUpload = true,
  initialTargetView = '3D'
}) => {
  const { currentProject, applyConvertedFloorPlan, createProjectFromConvertedPlan } = useProject();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [targetView, setTargetView] = useState<'2D' | '3D'>(initialTargetView);
  const [stage, setStage] = useState<
    | 'IDLE'
    | 'UPLOADING'
    | 'PREVIEW_ADJUST'
    | 'EXTRACTING_TEXT'
    | 'DETECTING_GEOMETRY'
    | 'REVIEW_DIMENSIONS'
    | 'GENERATING_3D'
    | 'VALIDATING_MODEL'
    | 'COMPLETED'
    | 'ERROR'
  >('IDLE');

  const [stageProgress, setStageProgress] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // File Details
  const [selectedFileDetails, setSelectedFileDetails] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl?: string;
  } | null>(null);

  // Image Adjustment Tools
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [contrastBoost, setContrastBoost] = useState<boolean>(false);

  // Detected Data for Review
  const [detectedWalls, setDetectedWalls] = useState<Wall[]>([]);
  const [detectedRooms, setDetectedRooms] = useState<Room[]>([]);
  const [detectedDoors, setDetectedDoors] = useState<Door[]>([]);
  const [detectedWindows, setDetectedWindows] = useState<WindowItem[]>([]);
  const [detectedScale, setDetectedScale] = useState<string | undefined>(undefined);
  const [planOverlayDataUrl, setPlanOverlayDataUrl] = useState<string>('');

  if (!isOpen) return null;

  // Process adjusted image or PDF canvas
  const handleProceedToAnalysis = async () => {
    if (!selectedFileDetails?.dataUrl) return;

    setStage('EXTRACTING_TEXT');
    setStageProgress(30);

    try {
      // 1. If rotated, apply rotation onto a fresh canvas
      let activeDataUrl = selectedFileDetails.dataUrl;
      if (rotationAngle !== 0) {
        const img = new Image();
        await new Promise((res, rej) => {
          img.onload = () => res(true);
          img.onerror = rej;
          img.src = selectedFileDetails.dataUrl!;
        });

        const rotCanvas = document.createElement('canvas');
        if (rotationAngle === 90 || rotationAngle === 270) {
          rotCanvas.width = img.height;
          rotCanvas.height = img.width;
        } else {
          rotCanvas.width = img.width;
          rotCanvas.height = img.height;
        }

        const ctx = rotCanvas.getContext('2d');
        if (ctx) {
          ctx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
          ctx.rotate((rotationAngle * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          activeDataUrl = rotCanvas.toDataURL('image/png');
        }
      }

      setPlanOverlayDataUrl(activeDataUrl);

      // 2. Stage 2 & 3: Extract text, dimensions, and detect architectural geometry
      setStage('DETECTING_GEOMETRY');
      setStageProgress(60);

      const options = {
        sensitivity: 50,
        wallThickness: 0.75,
        wallHeight: 9.5,
        plotWidth: currentProject?.plotWidth || 40,
        plotLength: currentProject?.plotLength || 30,
        unit: currentProject?.unit || 'feet',
        enhanceWithFurniture: true
      };

      const aiResult = await analyzeBlueprintWithAI(activeDataUrl, options);

      setDetectedWalls(aiResult.walls);
      setDetectedRooms(aiResult.rooms);
      setDetectedDoors(aiResult.doors);
      setDetectedWindows(aiResult.windows);

      setStageProgress(85);

      // 3. Stage 4: Open Review Extracted Dimensions Screen
      setStage('REVIEW_DIMENSIONS');
    } catch (err: any) {
      setStage('ERROR');
      setValidationError(err.message || 'Error occurred while analyzing plan geometry.');
    }
  };

  const handleFileSelected = async (file: File) => {
    setValidationError(null);
    setStage('UPLOADING');
    setStageProgress(15);

    const validation = await validateUploadedFloorPlanFile(file);

    if (!validation.isValid) {
      setStage('ERROR');
      setValidationError(validation.errorMessage || 'Invalid floor plan file uploaded.');
      return;
    }

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let dataUrl = '';

      if (ext === 'pdf' || file.type === 'application/pdf') {
        // PDF floor plan: Rasterize high-resolution vector page with pdfjs
        const arrayBuf = await file.arrayBuffer();
        const pdfPlan = await renderPdfFloorPlanToCanvas(arrayBuf);
        dataUrl = pdfPlan.dataUrl;
        if (pdfPlan.detectedScale) {
          setDetectedScale(pdfPlan.detectedScale);
        }
      } else {
        // Image file (PNG, JPG, WEBP, SVG)
        const fileReader = new FileReader();
        dataUrl = await new Promise<string>((resolve, reject) => {
          fileReader.onload = () => resolve(fileReader.result as string);
          fileReader.onerror = reject;
          fileReader.readAsDataURL(file);
        });
      }

      setSelectedFileDetails({
        name: file.name,
        size: validation.fileDetails?.sizeFormatted || '1.2 MB',
        type: file.type || ext?.toUpperCase() || 'IMAGE',
        dataUrl
      });

      setRotationAngle(0);
      setZoomLevel(1);
      setStage('PREVIEW_ADJUST');
      setStageProgress(25);
    } catch (err: any) {
      setStage('ERROR');
      setValidationError(err.message || 'Failed to read floor plan file.');
    }
  };

  const handleLoadSampleBlueprint = (sampleTitle: string) => {
    setValidationError(null);
    setStage('PREVIEW_ADJUST');
    const dataUrl = generateSampleBlueprintDataUrl(sampleTitle);
    setSelectedFileDetails({
      name: `${sampleTitle}.png`,
      size: '450 KB',
      type: 'image/png',
      dataUrl
    });
    setRotationAngle(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // Called when user completes the Dimension Review screen
  const handleFinalModelGeneration = (
    finalWalls: Wall[],
    finalRooms: Room[],
    finalDoors: Door[],
    finalWindows: WindowItem[],
    destinationView: '2D' | '3D' = targetView
  ) => {
    setStage('GENERATING_3D');
    setStageProgress(90);

    const fileName = selectedFileDetails?.name || 'Uploaded Floor Plan';
    const fileSizeFormatted = selectedFileDetails?.size || '1.2 MB';
    const fileType = selectedFileDetails?.type || 'IMAGE';
    const dataUrl = planOverlayDataUrl || selectedFileDetails?.dataUrl || '';

    const plotW = currentProject?.plotWidth || 40;
    const plotL = currentProject?.plotLength || 30;
    const bounds = calculateOverlayBounds(4, 3, plotW, plotL);

    const overlay = {
      imageUrl: dataUrl,
      originalFileName: fileName,
      originalFileSize: fileSizeFormatted,
      originalFileType: fileType,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      visible: true,
      opacity: 0.5
    };

    let activeProjectId = currentProject?.id || '';

    if (createNewProjectOnUpload || !currentProject) {
      const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Generated House Model';
      const formattedTitle = cleanName
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      const newProj = createProjectFromConvertedPlan(
        formattedTitle,
        finalWalls,
        finalRooms,
        finalDoors,
        finalWindows,
        overlay,
        dataUrl,
        destinationView
      );
      activeProjectId = newProj.id;
    } else {
      applyConvertedFloorPlan(
        finalWalls,
        finalRooms,
        finalDoors,
        finalWindows,
        overlay,
        destinationView === '3D'
      );
    }

    setStage('VALIDATING_MODEL');
    setStageProgress(98);

    confetti({ particleCount: 75, spread: 70, origin: { y: 0.35 } });

    setTimeout(() => {
      setStage('COMPLETED');
      onClose();
      onPlanLoadedAndProcessed?.({
        projectId: activeProjectId,
        targetView: destinationView
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 select-none">
      <div className="bg-white border border-emerald-100 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* ── CONDITIONAL CONTENT BASED ON STAGE ── */}

        {/* 1. DIMENSION REVIEW SCREEN (Stage 4) */}
        {stage === 'REVIEW_DIMENSIONS' ? (
          <DimensionReviewScreen
            initialRooms={detectedRooms}
            initialWalls={detectedWalls}
            initialDoors={detectedDoors}
            initialWindows={detectedWindows}
            planImageUrl={planOverlayDataUrl}
            detectedScale={detectedScale}
            unit={currentProject?.unit || 'feet'}
            plotWidth={currentProject?.plotWidth || 40}
            plotLength={currentProject?.plotLength || 30}
            onGenerate3D={(w, r, d, win) => handleFinalModelGeneration(w, r, d, win, '3D')}
            onApplyTo2D={(w, r, d, win) => handleFinalModelGeneration(w, r, d, win, '2D')}
            onBackToUpload={() => setStage('PREVIEW_ADJUST')}
          />
        ) : (
          <>
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-emerald-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 shrink-0">
                  <Upload size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">UPLOAD &amp; CONVERT 2D FLOOR PLAN</h3>
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Accurate 2D → 3D
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Upload PDF or image plan, verify dimensions, and generate authentic 3D house model.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Validation Error Alert */}
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5 font-medium animate-in fade-in duration-150">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-xs">Upload Notice</div>
                    <div className="text-[11px] text-rose-700 mt-0.5">{validationError}</div>
                  </div>
                </div>
              )}

              {/* IDLE / DROPZONE */}
              {(stage === 'IDLE' || stage === 'ERROR') && (
                <div className="space-y-4">
                  {/* Primary Target Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                      Conversion Target Workspace
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTargetView('3D')}
                        className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                          targetView === '3D'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${targetView === '3D' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Box size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">3D House Model</div>
                          <div className="text-[10px] text-slate-500 font-normal">Real-time WebGL walkthrough with physical walls</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetView('2D')}
                        className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                          targetView === '2D'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${targetView === '2D' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Layers size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">2D CAD Drafting</div>
                          <div className="text-[10px] text-slate-500 font-normal">Editable vector layout &amp; annotations</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/25 hover:bg-emerald-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelected(e.target.files[0]);
                        }
                      }}
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, application/pdf"
                      className="hidden"
                    />

                    <div className="w-14 h-14 bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center mb-3 transition transform group-hover:scale-110 shadow-sm">
                      <FileUp size={28} />
                    </div>

                    <h4 className="font-black text-slate-800 text-sm mb-1">
                      Drag &amp; Drop Floor Plan Blueprint (PDF, PNG, JPG)
                    </h4>
                    <p className="text-slate-500 text-xs mb-3">
                      Architectural vector PDFs and scanned raster blueprints supported
                    </p>

                    <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition text-xs flex items-center gap-1.5 cursor-pointer">
                      <Upload size={14} />
                      <span>Browse Files</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 w-full flex items-center justify-between text-[11px] text-slate-400">
                      <span>Supported: PDF, PNG, JPG, JPEG</span>
                      <span>High Resolution Extraction</span>
                    </div>
                  </div>

                  {/* Quick Sample Demo */}
                  <div className="pt-1 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-500" />
                        <span>Try Sample Blueprint:</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '3BHK Villa Blueprint', icon: '🏡' },
                        { label: 'Modern 2BHK Apartment', icon: '🏢' },
                        { label: 'Studio Suite Plan', icon: '📐' }
                      ].map((sample, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleLoadSampleBlueprint(sample.label)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{sample.icon}</span>
                          <span>{sample.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE: PREVIEW & ADJUST (Rotate, Zoom, Crop) */}
              {stage === 'PREVIEW_ADJUST' && selectedFileDetails && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={18} className="text-emerald-600" />
                      <div>
                        <span className="font-bold text-slate-800 text-xs">{selectedFileDetails.name}</span>
                        <div className="text-[10px] text-slate-500">{selectedFileDetails.size} · {selectedFileDetails.type}</div>
                      </div>
                    </div>

                    {/* Image Adjustment Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRotationAngle(r => (r + 90) % 360)}
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                        title="Rotate 90°"
                      >
                        <RotateCw size={14} />
                        <span>Rotate ({rotationAngle}°)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setZoomLevel(z => Math.max(0.75, z - 0.25))}
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setZoomLevel(z => Math.min(2.0, z + 0.25))}
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Visual Preview Box */}
                  <div className="w-full h-64 bg-slate-900 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-3 relative">
                    <img
                      src={selectedFileDetails.dataUrl}
                      alt="Uploaded Blueprint Preview"
                      style={{
                        transform: `rotate(${rotationAngle}deg) scale(${zoomLevel})`,
                        transition: 'transform 0.2s ease-out'
                      }}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setStage('IDLE')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Choose Different File
                    </button>

                    <button
                      type="button"
                      onClick={handleProceedToAnalysis}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/25 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span>Analyze Plan &amp; Verify Dimensions</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE: ACTIVE ANALYSIS PIPELINE */}
              {(stage === 'UPLOADING' ||
                stage === 'EXTRACTING_TEXT' ||
                stage === 'DETECTING_GEOMETRY' ||
                stage === 'GENERATING_3D' ||
                stage === 'VALIDATING_MODEL') && (
                <div className="space-y-4 py-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <div className="text-center space-y-1 mb-4">
                      <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        {stage === 'UPLOADING' && '1. Uploading & Validating Blueprint File...'}
                        {stage === 'EXTRACTING_TEXT' && '2. Extracting Text Annotations & Scale Dimensions...'}
                        {stage === 'DETECTING_GEOMETRY' && '3. Vectorizing Walls, Room Polygons & Openings...'}
                        {stage === 'GENERATING_3D' && '4. Synthesizing Physical 3D Walls & Room Openings...'}
                        {stage === 'VALIDATING_MODEL' && '5. Validating Geometry & Preparing 3D Studio...'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {selectedFileDetails?.name} · Precision architectural geometric interpretation
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full transition-all duration-300"
                        style={{ width: `${stageProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

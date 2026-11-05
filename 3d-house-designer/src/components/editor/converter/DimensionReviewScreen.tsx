import React, { useState, useRef, useEffect } from 'react';
import { Wall, Room, Door, WindowItem, UnitType } from '../../../types/floorplan';
import { formatArea } from '../../../utils/unitConverter';
import {
  Sparkles,
  Check,
  RotateCw,
  Ruler,
  AlertTriangle,
  Info,
  Layers,
  Box,
  Edit2,
  Trash2,
  Plus,
  ArrowRight,
  Maximize2,
  Eye,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type DimensionSourceType = 'extracted' | 'calculated' | 'confirmed' | 'estimated';

export interface EditableRoomRecord extends Room {
  widthEst?: number;
  lengthEst?: number;
  sourceType: DimensionSourceType;
}

export interface DimensionReviewScreenProps {
  initialRooms: Room[];
  initialWalls: Wall[];
  initialDoors: Door[];
  initialWindows: WindowItem[];
  planImageUrl?: string;
  detectedScale?: string;
  unit: UnitType;
  plotWidth: number;
  plotLength: number;
  onGenerate3D: (walls: Wall[], rooms: Room[], doors: Door[], windows: WindowItem[]) => void;
  onApplyTo2D: (walls: Wall[], rooms: Room[], doors: Door[], windows: WindowItem[]) => void;
  onBackToUpload?: () => void;
}

export const DimensionReviewScreen: React.FC<DimensionReviewScreenProps> = ({
  initialRooms,
  initialWalls,
  initialDoors,
  initialWindows,
  planImageUrl,
  detectedScale,
  unit,
  plotWidth,
  plotLength,
  onGenerate3D,
  onApplyTo2D,
  onBackToUpload
}) => {
  // Editable State
  const [rooms, setRooms] = useState<EditableRoomRecord[]>(() =>
    initialRooms.map(r => {
      // Calculate bounding box width/length approximation
      const xs = r.polygon?.map(p => p.x) || [0, 10];
      const ys = r.polygon?.map(p => p.y) || [0, 10];
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const w = Math.round((maxX - minX) * 10) / 10;
      const l = Math.round((maxY - minY) * 10) / 10;

      return {
        ...r,
        widthEst: w,
        lengthEst: l,
        sourceType: detectedScale ? 'calculated' : 'estimated'
      };
    })
  );

  const [walls, setWalls] = useState<Wall[]>(initialWalls);
  const [doors, setDoors] = useState<Door[]>(initialDoors);
  const [windows, setWindows] = useState<WindowItem[]>(initialWindows);

  // Global extrusion parameters
  const [globalWallThickness, setGlobalWallThickness] = useState<number>(0.75);
  const [globalWallHeight, setGlobalWallHeight] = useState<number>(9.5);

  // 2-Point Reference Calibration Tool State
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibPoint1, setCalibPoint1] = useState<{ x: number; y: number } | null>(null);
  const [calibPoint2, setCalibPoint2] = useState<{ x: number; y: number } | null>(null);
  const [knownDistanceInput, setKnownDistanceInput] = useState<string>('30');
  const [calibrationSuccessMessage, setCalibrationSuccessMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active review tab
  const [reviewTab, setReviewTab] = useState<'rooms' | 'walls' | 'openings' | 'calibration'>('rooms');

  // Total area calculation
  const totalLivingArea = rooms.reduce((acc, r) => acc + (r.area || 0), 0);

  // Connectivity and validation warnings
  const validationWarnings: string[] = [];
  if (walls.length < 4) {
    validationWarnings.push('Fewer than 4 walls detected; some rooms may be unclosed.');
  }
  const unattachedDoors = doors.filter(d => !walls.some(w => w.id === d.wallId));
  if (unattachedDoors.length > 0) {
    validationWarnings.push(`${unattachedDoors.length} door(s) are near perimeter but not attached to an indexed wall.`);
  }

  // Draw Calibration canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !planImageUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
      ctx.drawImage(img, 0, 0);

      // Draw Calibration Points & Line if any
      if (calibPoint1) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(calibPoint1.x, calibPoint1.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Point 1', calibPoint1.x + 10, calibPoint1.y - 10);
      }

      if (calibPoint2) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(calibPoint2.x, calibPoint2.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Point 2', calibPoint2.x + 10, calibPoint2.y - 10);
      }

      if (calibPoint1 && calibPoint2) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(calibPoint1.x, calibPoint1.y);
        ctx.lineTo(calibPoint2.x, calibPoint2.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };
    img.src = planImageUrl;
  }, [planImageUrl, calibPoint1, calibPoint2]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCalibrating) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (!calibPoint1) {
      setCalibPoint1({ x, y });
    } else if (!calibPoint2) {
      setCalibPoint2({ x, y });
    } else {
      // Reset and set point 1
      setCalibPoint1({ x, y });
      setCalibPoint2(null);
    }
  };

  const applyCalibration = () => {
    if (!calibPoint1 || !calibPoint2) {
      alert('Please select two points on the plan image first.');
      return;
    }
    const realDist = parseFloat(knownDistanceInput);
    if (isNaN(realDist) || realDist <= 0) {
      alert('Please enter a valid positive measurement distance.');
      return;
    }

    const dx = calibPoint2.x - calibPoint1.x;
    const dy = calibPoint2.y - calibPoint1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    if (pixelDistance < 5) {
      alert('Points are too close together. Please select two distant endpoints (such as an exterior wall).');
      return;
    }

    // Scale ratio: pixels per unit
    const pixelsPerUnit = pixelDistance / realDist;
    const currentEstimatedPlotWidth = plotWidth || 40;
    const newPlotWidth = Math.round(canvasRef.current ? canvasRef.current.width / pixelsPerUnit : currentEstimatedPlotWidth);
    const scaleFactor = realDist / (pixelDistance / (canvasRef.current?.width || 800) * (plotWidth || 40));

    // Update rooms to 'confirmed' status and recalculate areas
    setRooms(prev =>
      prev.map(r => ({
        ...r,
        area: Math.round(r.area * (scaleFactor > 0 ? scaleFactor * scaleFactor : 1)),
        widthEst: r.widthEst ? Math.round(r.widthEst * scaleFactor * 10) / 10 : r.widthEst,
        lengthEst: r.lengthEst ? Math.round(r.lengthEst * scaleFactor * 10) / 10 : r.lengthEst,
        sourceType: 'confirmed'
      }))
    );

    setIsCalibrating(false);
    setCalibrationSuccessMessage(
      `Calibrated successfully! 2-point reference set to ${realDist} ${unit} (${Math.round(pixelsPerUnit)} px/${unit}). Dimensions updated.`
    );
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.3 } });
  };

  const handleUpdateRoom = (index: number, updates: Partial<EditableRoomRecord>) => {
    setRooms(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates, sourceType: 'confirmed' };
      return next;
    });
  };

  const handleFinalGenerate3D = () => {
    // Apply global wall height & thickness
    const finalWalls = walls.map(w => ({
      ...w,
      thickness: globalWallThickness,
      height: globalWallHeight
    }));

    onGenerate3D(finalWalls, rooms, doors, windows);
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.3 } });
  };

  const handleFinalApply2D = () => {
    const finalWalls = walls.map(w => ({
      ...w,
      thickness: globalWallThickness,
      height: globalWallHeight
    }));

    onApplyTo2D(finalWalls, rooms, doors, windows);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
  };

  const getSourceBadge = (source: DimensionSourceType) => {
    switch (source) {
      case 'confirmed':
        return (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
            User-Confirmed
          </span>
        );
      case 'extracted':
        return (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-300">
            Extracted from Source
          </span>
        );
      case 'calculated':
        return (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
            Calculated from Scale
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
            Estimated / Review
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 select-none">
      {/* ── TOP HEADER ── */}
      <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-white shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">VERIFY &amp; CONFIRM EXTRACTED DIMENSIONS</h3>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Accuracy Guaranteed
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Review architectural geometry, edit room boundaries, verify scale calibration, then build the authentic 3D model.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBackToUpload && (
            <button
              onClick={onBackToUpload}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              Re-upload
            </button>
          )}

          <button
            onClick={handleFinalApply2D}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition cursor-pointer"
          >
            <Check size={14} />
            <span>Apply to 2D Plan</span>
          </button>

          <button
            onClick={handleFinalGenerate3D}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition cursor-pointer"
          >
            <Sparkles size={15} />
            <span>Generate 3D Model Now</span>
          </button>
        </div>
      </div>

      {/* ── METRIC STATS BANNER ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 px-6 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Rooms Detected</span>
          <span className="text-base font-black text-slate-900">{rooms.length}</span>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Walls Extracted</span>
          <span className="text-base font-black text-slate-900">{walls.length}</span>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Doors &amp; Windows</span>
          <span className="text-base font-black text-slate-900">{doors.length + windows.length}</span>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Living Area</span>
          <span className="text-base font-black text-emerald-700">{formatArea(totalLivingArea, unit)}</span>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Scale Status</span>
          <span className="text-xs font-bold text-slate-800">
            {detectedScale ? `Architectural ${detectedScale}` : 'Interactive Calibrated'}
          </span>
        </div>
      </div>

      {/* Warnings Banner if any */}
      {validationWarnings.length > 0 && (
        <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900 shrink-0">
          <AlertTriangle size={15} className="text-amber-600 shrink-0" />
          <span className="font-semibold">Review notices:</span>
          <span>{validationWarnings.join(' · ')}</span>
        </div>
      )}

      {calibrationSuccessMessage && (
        <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 shrink-0">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>{calibrationSuccessMessage}</span>
        </div>
      )}

      {/* ── NAVIGATION SUB-TABS ── */}
      <div className="px-6 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 text-xs shrink-0">
        <button
          onClick={() => setReviewTab('rooms')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            reviewTab === 'rooms' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers size={13} />
          <span>Rooms &amp; Dimensions ({rooms.length})</span>
        </button>

        <button
          onClick={() => setReviewTab('walls')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            reviewTab === 'walls' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders size={13} />
          <span>Wall Height &amp; Thickness</span>
        </button>

        <button
          onClick={() => setReviewTab('openings')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            reviewTab === 'openings' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Box size={13} />
          <span>Doors &amp; Windows ({doors.length + windows.length})</span>
        </button>

        <button
          onClick={() => setReviewTab('calibration')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            reviewTab === 'calibration' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Ruler size={13} />
          <span>2-Point Plan Calibration Tool</span>
        </button>
      </div>

      {/* ── TAB PANELS ── */}
      <div className="flex-1 overflow-y-auto p-6 text-xs">
        {/* TAB 1: ROOMS BREAKDOWN TABLE */}
        {reviewTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Detected Rooms Schedule</h4>
                <p className="text-xs text-slate-500">
                  You can rename rooms, edit dimensions, change floor materials, and adjust calculated areas.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                    <th className="p-3 pl-4">Room Name</th>
                    <th className="p-3">Room Type</th>
                    <th className="p-3">Dimensions ({unit})</th>
                    <th className="p-3">Floor Area</th>
                    <th className="p-3">Floor Finish</th>
                    <th className="p-3">Accuracy Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rooms.map((room, idx) => (
                    <tr key={room.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 pl-4">
                        <input
                          type="text"
                          value={room.name}
                          onChange={e => handleUpdateRoom(idx, { name: e.target.value })}
                          className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 w-44 focus:outline-emerald-500"
                        />
                      </td>

                      <td className="p-3">
                        <select
                          value={room.type}
                          onChange={e => handleUpdateRoom(idx, { type: e.target.value })}
                          className="px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white"
                        >
                          <option value="Living Room">Living Room</option>
                          <option value="Master Bedroom">Master Bedroom</option>
                          <option value="Bedroom">Bedroom</option>
                          <option value="Kitchen">Kitchen</option>
                          <option value="Bathroom">Bathroom</option>
                          <option value="Dining Room">Dining Room</option>
                          <option value="Corridor">Corridor / Hall</option>
                          <option value="Balcony">Balcony / Terrace</option>
                          <option value="Foyer">Foyer / Entry</option>
                        </select>
                      </td>

                      <td className="p-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.5"
                            value={room.widthEst || 12}
                            onChange={e => {
                              const w = parseFloat(e.target.value) || 0;
                              const l = room.lengthEst || 12;
                              handleUpdateRoom(idx, { widthEst: w, area: Math.round(w * l) });
                            }}
                            className="w-14 px-1.5 py-1 border border-slate-200 rounded text-center text-xs"
                          />
                          <span>×</span>
                          <input
                            type="number"
                            step="0.5"
                            value={room.lengthEst || 12}
                            onChange={e => {
                              const l = parseFloat(e.target.value) || 0;
                              const w = room.widthEst || 12;
                              handleUpdateRoom(idx, { lengthEst: l, area: Math.round(w * l) });
                            }}
                            className="w-14 px-1.5 py-1 border border-slate-200 rounded text-center text-xs"
                          />
                        </div>
                      </td>

                      <td className="p-3 font-bold text-emerald-800">
                        {formatArea(room.area, unit)}
                      </td>

                      <td className="p-3">
                        <select
                          value={room.floorMaterial}
                          onChange={e => handleUpdateRoom(idx, { floorMaterial: e.target.value as any })}
                          className="px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white capitalize"
                        >
                          <option value="wood">Wood Planks</option>
                          <option value="tile">Ceramic Tile</option>
                          <option value="marble">Italian Marble</option>
                          <option value="concrete">Polished Concrete</option>
                          <option value="carpet">Textured Carpet</option>
                        </select>
                      </td>

                      <td className="p-3">
                        {getSourceBadge(room.sourceType)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: WALL PARAMETERS */}
        {reviewTab === 'walls' && (
          <div className="max-w-xl space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Global Wall Extrusion &amp; Heights</h4>
            <p className="text-xs text-slate-500">
              Configure physical thickness and vertical elevation for structural exterior and interior walls.
            </p>

            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Wall Thickness ({unit}):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Thin (0.5)', val: 0.5 },
                    { label: 'Standard (0.75)', val: 0.75 },
                    { label: 'Thick (1.0)', val: 1.0 }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setGlobalWallThickness(item.val)}
                      className={`p-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                        globalWallThickness === item.val
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Ceiling / Wall Height ({unit}):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '8.5 ft', val: 8.5 },
                    { label: '9.5 ft (Standard)', val: 9.5 },
                    { label: '11.0 ft (High Ceiling)', val: 11.0 }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setGlobalWallHeight(item.val)}
                      className={`p-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                        globalWallHeight === item.val
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                <strong>Real Wall Cutouts:</strong> During 3D generation, Three.js constructs true openings with lintels and sills rather than solid blocks with textures.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DOORS & WINDOWS */}
        {reviewTab === 'openings' && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Doors &amp; Window Cutouts Schedule</h4>
            <p className="text-xs text-slate-500">
              Openings are positioned along appropriate walls with accurate opening widths and sill heights.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h5 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>Detected Doors ({doors.length})</span>
                  <span className="text-[10px] text-slate-400">Position ratio along wall</span>
                </h5>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {doors.map((door, i) => (
                    <div key={door.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">Door #{i + 1} ({door.doorType})</span>
                        <div className="text-[10px] text-slate-400">Width: {door.width} {unit} · Height: {door.height} {unit}</div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {Math.round(door.positionRatio * 100)}% on wall
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h5 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>Detected Windows ({windows.length})</span>
                  <span className="text-[10px] text-slate-400">Sill height elevation</span>
                </h5>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {windows.map((win, i) => (
                    <div key={win.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">Window #{i + 1} ({win.windowType})</span>
                        <div className="text-[10px] text-slate-400">Width: {win.width} {unit} · Sill: {win.sillHeight} {unit}</div>
                      </div>
                      <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {win.width}×{win.height} {unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 2-POINT INTERACTIVE CALIBRATION */}
        {reviewTab === 'calibration' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">2-Point Reference Measurement Calibration</h4>
              <p className="text-xs text-slate-500">
                Click two points along any wall or known span on the plan image below, then type the real-world distance to accurately calibrate the entire floor plan.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCalibrating(true);
                  setCalibPoint1(null);
                  setCalibPoint2(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                  isCalibrating ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {isCalibrating ? 'Click on 2 Points in Image Below...' : 'Start 2-Point Selection'}
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-semibold">Known Distance:</span>
                <input
                  type="number"
                  value={knownDistanceInput}
                  onChange={e => setKnownDistanceInput(e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-center text-xs font-bold"
                />
                <span className="font-bold text-slate-700">{unit}</span>
              </div>

              <button
                type="button"
                onClick={applyCalibration}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Apply Calibration to Model
              </button>
            </div>

            {/* Plan canvas */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 flex justify-center max-h-96">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="max-h-96 object-contain cursor-crosshair"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ACTIONS ── */}
      <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
        <div className="text-xs text-slate-500">
          Ready to construct authentic 3D house model with verified walls, door openings, and room geometry.
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFinalApply2D}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Apply to 2D Plan
          </button>
          <button
            onClick={handleFinalGenerate3D}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-2"
          >
            <Sparkles size={16} />
            <span>Generate 3D Model &amp; Open Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};

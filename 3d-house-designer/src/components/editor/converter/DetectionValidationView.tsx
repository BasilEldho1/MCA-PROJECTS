import React, { useRef, useEffect, useState } from 'react';
import { MultiRepresentationMaps } from '../../../utils/detection/preprocessingPipeline';
import { Wall, Room, Door, WindowItem } from '../../../types/floorplan';
import { X, Sparkles, Check, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DetectionValidationViewProps {
  maps: MultiRepresentationMaps;
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: WindowItem[];
  plotWidth: number;
  plotLength: number;
  unit: string;
  onApplyTo2D: (walls: Wall[], rooms: Room[], doors: Door[], windows: WindowItem[]) => void;
  onGenerate3D: (walls: Wall[], rooms: Room[], doors: Door[], windows: WindowItem[]) => void;
  onClose: () => void;
}

type ValidationLayer = 'original' | 'grayscale' | 'binary' | 'edge' | 'wallCandidate';

export const DetectionValidationView: React.FC<DetectionValidationViewProps> = ({
  maps, walls, rooms, doors, windows, plotWidth, plotLength, onApplyTo2D, onGenerate3D, onClose
}) => {
  const [activeLayer, setActiveLayer] = useState<ValidationLayer>('original');
  const [showWallOverlay, setShowWallOverlay] = useState(true);
  const [showRoomOverlay, setShowRoomOverlay] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !maps) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = maps.width;
    canvas.height = maps.height;
    let sourceCanvas: HTMLCanvasElement | null = null;
    switch (activeLayer) {
      case 'grayscale': sourceCanvas = maps.grayscaleCanvas; break;
      case 'binary': sourceCanvas = maps.binaryCanvas; break;
      case 'edge': sourceCanvas = maps.edgeMapCanvas; break;
      case 'wallCandidate': sourceCanvas = maps.wallCandidateCanvas; break;
      default: sourceCanvas = null;
    }
    const drawOverlays = (ctx2: CanvasRenderingContext2D, w: number, h: number) => {
      const scaleX = w / plotWidth;
      const scaleY = h / plotLength;
      if (showWallOverlay) {
        ctx2.strokeStyle = '#22c55e';
        ctx2.lineWidth = 2;
        walls.forEach(wall => {
          ctx2.beginPath();
          ctx2.moveTo(wall.start.x * scaleX, wall.start.y * scaleY);
          ctx2.lineTo(wall.end.x * scaleX, wall.end.y * scaleY);
          ctx2.stroke();
        });
      }
      if (showRoomOverlay) {
        rooms.forEach(room => {
          if (!room.polygon || room.polygon.length < 3) return;
          ctx2.fillStyle = (room.floorColor || '#10b981') + '44';
          ctx2.strokeStyle = '#059669';
          ctx2.lineWidth = 1;
          ctx2.beginPath();
          ctx2.moveTo(room.polygon[0].x * scaleX, room.polygon[0].y * scaleY);
          for (let i = 1; i < room.polygon.length; i++) {
            ctx2.lineTo(room.polygon[i].x * scaleX, room.polygon[i].y * scaleY);
          }
          ctx2.closePath();
          ctx2.fill();
          ctx2.stroke();
        });
      }
    };
    if (sourceCanvas) {
      ctx.drawImage(sourceCanvas, 0, 0);
      drawOverlays(ctx, canvas.width, canvas.height);
    } else {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawOverlays(ctx, canvas.width, canvas.height);
      };
      img.src = maps.originalDataUrl;
    }
  }, [activeLayer, maps, walls, rooms, showWallOverlay, showRoomOverlay, plotWidth, plotLength]);

  const layers: { id: ValidationLayer; label: string; desc: string }[] = [
    { id: 'original', label: 'Original', desc: 'Source blueprint image' },
    { id: 'grayscale', label: 'Grayscale', desc: 'Luminance normalized' },
    { id: 'binary', label: 'Binary', desc: 'Thresholded mask' },
    { id: 'edge', label: 'Edge Map', desc: 'Canny edge detection' },
    { id: 'wallCandidate', label: 'Wall Lines', desc: 'Hough line candidates' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-sm text-white">Detection Pipeline Validation</h3>
          <p className="text-xs text-slate-400">
            {walls.length} walls &middot; {rooms.length} rooms &middot; {doors.length} doors &middot; {windows.length} windows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { onGenerate3D(walls, rooms, doors, windows); confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 } }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-lg hover:from-emerald-500 hover:to-teal-500 transition"
          >
            <Sparkles size={13} />
            <span>Generate 3D</span>
          </button>
          <button
            onClick={() => onApplyTo2D(walls, rooms, doors, windows)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded-lg hover:bg-slate-600 transition"
          >
            <Check size={13} />
            <span>Apply to 2D</span>
          </button>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="w-44 border-r border-slate-800 flex flex-col gap-1 p-3 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Pipeline Layers</div>
          {layers.map(layer => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition ${activeLayer === layer.id ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="font-semibold">{layer.label}</div>
              <div className={`text-[10px] mt-0.5 ${activeLayer === layer.id ? 'text-emerald-100' : 'text-slate-500'}`}>{layer.desc}</div>
            </button>
          ))}

          <div className="mt-3 border-t border-slate-800 pt-3 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Overlays</div>
            <button
              onClick={() => setShowWallOverlay(v => !v)}
              className={`flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${showWallOverlay ? 'bg-green-900/50 text-green-300' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              {showWallOverlay ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>Walls</span>
            </button>
            <button
              onClick={() => setShowRoomOverlay(v => !v)}
              className={`flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${showRoomOverlay ? 'bg-teal-900/50 text-teal-300' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              {showRoomOverlay ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>Rooms</span>
            </button>
          </div>

          <div className="mt-3 border-t border-slate-800 pt-3 space-y-1.5">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Detection Stats</div>
            {[
              { label: 'Resolution', value: `${maps.width}x${maps.height}` },
              { label: 'Quality', value: maps.resolutionQuality },
              { label: 'Walls', value: walls.length },
              { label: 'Rooms', value: rooms.length },
              { label: 'Doors', value: doors.length },
              { label: 'Windows', value: windows.length }
            ].map(stat => (
              <div key={stat.label} className="flex justify-between text-[11px]">
                <span className="text-slate-500">{stat.label}</span>
                <span className="text-slate-300 font-mono font-semibold">{stat.value}</span>
              </div>
            ))}
            {maps.warningMessage && (
              <div className="mt-2 p-2 bg-amber-900/30 border border-amber-700/50 rounded text-[10px] text-amber-300">
                Warning: {maps.warningMessage}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-slate-900 overflow-hidden p-4">
          <div className="relative max-w-full max-h-full">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain rounded-xl border border-slate-700 shadow-2xl"
            />
            <div className="absolute top-2 left-2 bg-slate-900/80 text-[10px] text-slate-300 px-2 py-1 rounded border border-slate-700 font-mono backdrop-blur">
              {layers.find(l => l.id === activeLayer)?.label} &middot; {maps.width}x{maps.height}px
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

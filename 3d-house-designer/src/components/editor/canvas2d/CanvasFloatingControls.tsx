import React from 'react';
import { useProject } from '../../../context/ProjectContext';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Magnet,
  Ruler
} from 'lucide-react';

interface CanvasFloatingControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
}

export const CanvasFloatingControls: React.FC<CanvasFloatingControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen
}) => {
  const { showGrid, setShowGrid, snapGrid, setSnapGrid, activeView } = useProject();

  if (activeView !== '2D') return null;

  return (
    <div className="absolute bottom-5 left-5 z-20 flex flex-col gap-1.5 select-none">
      {/* Zoom Controls */}
      <div className="flex flex-col bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={onZoomIn}
          className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition flex items-center justify-center border-b border-slate-100"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>

        <div className="px-2 py-1 text-center text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50/60 border-b border-slate-100">
          {Math.round((zoom / 14) * 100)}%
        </div>

        <button
          onClick={onZoomOut}
          className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition flex items-center justify-center border-b border-slate-100"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>

        <button
          onClick={onFitToScreen}
          className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition flex items-center justify-center"
          title="Fit to Screen"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Grid & Snap Controls */}
      <div className="flex flex-col bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2.5 transition flex items-center justify-center border-b border-slate-100 ${
            showGrid ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
          title="Toggle Grid"
        >
          <Grid3X3 size={15} />
        </button>

        <button
          onClick={() => setSnapGrid(!snapGrid)}
          className={`p-2.5 transition flex items-center justify-center ${
            snapGrid ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
          title="Toggle Snap to Grid"
        >
          <Magnet size={15} />
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { UnitType, Point2D } from '../../../types/floorplan';
import { Ruler, Check, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface ScaleCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  p1: Point2D | null;
  p2: Point2D | null;
  currentUnit: UnitType;
  pixelDistance: number;
  onApplyScale: (realDistance: number, unit: UnitType, pixelsPerUnit: number) => void;
}

export const ScaleCalibrationModal: React.FC<ScaleCalibrationModalProps> = ({
  isOpen,
  onClose,
  p1,
  p2,
  currentUnit,
  pixelDistance,
  onApplyScale
}) => {
  const [distanceInput, setDistanceInput] = useState<string>('10');
  const [selectedUnit, setSelectedUnit] = useState<UnitType>(currentUnit);
  const [subUnit, setSubUnit] = useState<'ft' | 'in' | 'm' | 'cm' | 'mm'>(currentUnit === 'feet' ? 'ft' : 'm');

  if (!isOpen) return null;

  const numericVal = parseFloat(distanceInput) || 10;
  
  // Normalize distance to primary project unit (feet or meters)
  let normalizedDistanceInProjectUnit = numericVal;
  if (selectedUnit === 'feet') {
    if (subUnit === 'in') normalizedDistanceInProjectUnit = numericVal / 12;
  } else {
    if (subUnit === 'cm') normalizedDistanceInProjectUnit = numericVal / 100;
    if (subUnit === 'mm') normalizedDistanceInProjectUnit = numericVal / 1000;
  }

  const calculatedPixelsPerUnit = pixelDistance / Math.max(0.1, normalizedDistanceInProjectUnit);

  const handleApply = () => {
    onApplyScale(normalizedDistanceInProjectUnit, selectedUnit, calculatedPixelsPerUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 select-none">
      <div className="bg-white border border-emerald-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="p-4 px-6 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Ruler size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Scale Calibration</h3>
              <p className="text-xs text-slate-500">Set real-world distance between 2 reference points</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Reference Points info */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-600 text-[11px] font-medium">
              <span>Pixel Distance on Image:</span>
              <span className="font-mono text-emerald-700 font-bold">{Math.round(pixelDistance)} px</span>
            </div>
            {p1 && p2 && (
              <div className="text-[10px] text-slate-400 font-mono">
                P1({Math.round(p1.x)}, {Math.round(p1.y)}) → P2({Math.round(p2.x)}, {Math.round(p2.y)})
              </div>
            )}
          </div>

          {/* Real World Distance Input */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Enter Actual Real-World Distance:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={distanceInput}
                onChange={e => setDistanceInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl font-bold font-mono text-sm text-slate-900 outline-none"
                placeholder="e.g. 10"
              />

              {/* Unit Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['ft', 'in', 'm', 'cm', 'mm'] as const).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setSubUnit(u);
                      if (u === 'ft' || u === 'in') setSelectedUnit('feet');
                      else setSelectedUnit('meters');
                    }}
                    className={`px-2 py-1 text-xs font-semibold rounded-lg transition ${
                      subUnit === u ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scale Calculation Preview */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
            <div>
              <div className="text-[11px] font-semibold text-emerald-800">Computed Scale Ratio:</div>
              <div className="font-mono text-xs font-bold text-emerald-700">
                1 {selectedUnit === 'feet' ? 'ft' : 'm'} = {Math.round(calculatedPixelsPerUnit * 10) / 10} px
              </div>
            </div>
            <ShieldCheck size={20} className="text-emerald-600" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Apply Scale Calibration</span>
          </button>
        </div>
      </div>
    </div>
  );
};

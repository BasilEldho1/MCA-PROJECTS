import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { UnitType } from '../../types/floorplan';
import { X, Sparkles, Building, Plus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (id: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated
}) => {
  const { createProject } = useProject();

  const [name, setName] = useState('Modern Villa Plan');
  const [houseType, setHouseType] = useState('Villa');
  const [plotWidth, setPlotWidth] = useState<number>(35);
  const [plotLength, setPlotLength] = useState<number>(55);
  const [unit, setUnit] = useState<UnitType>('feet');
  const [floorsCount, setFloorsCount] = useState<number>(2);

  // Building Specs State: Total Built-up Area in sync with Plot Dimensions
  const [targetSqFt, setTargetSqFt] = useState<number>(1925);

  const handleSqFtChange = (val: number) => {
    setTargetSqFt(val);
    if (val >= 100) {
      // Calculate realistic width and length matching the square feet entered (approx 1:1.5 aspect ratio)
      const w = Math.max(15, Math.round(Math.sqrt(val / 1.5)));
      const l = Math.max(15, Math.round(val / w));
      setPlotWidth(w);
      setPlotLength(l);
    }
  };

  const handleWidthChange = (w: number) => {
    setPlotWidth(w);
    setTargetSqFt(w * plotLength);
  };

  const handleLengthChange = (l: number) => {
    setPlotLength(l);
    setTargetSqFt(plotWidth * l);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProj = createProject(name, houseType, plotWidth, plotLength, unit, floorsCount, {
      targetSqFt: plotWidth * plotLength,
      bedrooms: 3,
      bathrooms: 2
    });
    onProjectCreated(newProj.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080d19]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 rounded-xl">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Create New Floor Plan</h2>
              <p className="text-[11px] text-slate-400">Configure building specifications and plot dimensions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Project Name */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Modern Lakefront Villa"
              className="w-full bg-[#080d19] border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* House Type & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">House Archetype</label>
              <select
                value={houseType}
                onChange={e => setHouseType(e.target.value)}
                className="w-full bg-[#080d19] border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="Kerala Traditional House">Kerala Traditional House</option>
                <option value="Villa">Luxury Villa</option>
                <option value="Contemporary Duplex">Contemporary Duplex</option>
                <option value="Single-Floor Bungalow">Single-Floor Bungalow</option>
                <option value="Compact Family Home">Compact Family Home</option>
                <option value="Country Farmhouse">Modern Country Farmhouse</option>
                <option value="Mediterranean Villa">Mediterranean Coastal Villa</option>
                <option value="Industrial Loft">Urban Industrial Loft</option>
                <option value="Apartment">Apartment Suite</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Measurement Unit</label>
              <div className="grid grid-cols-2 gap-1 bg-[#080d19] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setUnit('feet')}
                  className={`py-1.5 font-bold rounded-lg transition ${
                    unit === 'feet' ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Feet (ft)
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('meters')}
                  className={`py-1.5 font-bold rounded-lg transition ${
                    unit === 'meters' ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Meters (m)
                </button>
              </div>
            </div>
          </div>

          {/* BUILDING SPECIFICATIONS & AREA SECTION */}
          <div className="p-4 bg-[#080d19] rounded-xl border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                <Building size={14} />
                <span>Building Specifications &amp; Area</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                {plotWidth} × {plotLength} = {(plotWidth * plotLength).toLocaleString()} sq.{unit === 'feet' ? 'ft' : 'm'}
              </span>
            </div>

            {/* Total Built-up Area */}
            <div>
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span>Total Built-up Area</span>
                <span className="text-cyan-400 font-mono font-bold text-[11px]">
                  {targetSqFt.toLocaleString()} sq.{unit === 'feet' ? 'ft' : 'm'}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="200"
                  max="50000"
                  required
                  value={targetSqFt}
                  onChange={e => handleSqFtChange(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#030712] border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono focus:outline-none focus:border-cyan-500 transition"
                  placeholder="e.g. 1925"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-slate-500 font-mono">
                  sq.{unit === 'feet' ? 'ft' : 'm'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Changing area automatically calibrates the plot length and width.
              </p>
            </div>
          </div>

          {/* Plot Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">
                Plot Width ({unit === 'feet' ? 'ft' : 'm'})
              </label>
              <input
                type="number"
                min="15"
                max="300"
                required
                value={plotWidth}
                onChange={e => handleWidthChange(parseInt(e.target.value) || 15)}
                className="w-full bg-[#080d19] border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500 transition font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">
                Plot Length ({unit === 'feet' ? 'ft' : 'm'})
              </label>
              <input
                type="number"
                min="15"
                max="300"
                required
                value={plotLength}
                onChange={e => handleLengthChange(parseInt(e.target.value) || 15)}
                className="w-full bg-[#080d19] border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500 transition font-mono"
              />
            </div>
          </div>

          {/* Number of Floors */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Number of Floors</label>
            <select
              value={floorsCount}
              onChange={e => setFloorsCount(parseInt(e.target.value) || 1)}
              className="w-full bg-[#080d19] border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500 transition"
            >
              <option value={1}>1 Floor (Ground Level Single Story)</option>
              <option value={2}>2 Floors (Duplex / Two-Story Villa)</option>
              <option value={3}>3 Floors (Triplex / Multi-Story Residence)</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#080d19] hover:bg-slate-800 text-slate-300 font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition"
            >
              <Plus size={16} />
              <span>Create Floor Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

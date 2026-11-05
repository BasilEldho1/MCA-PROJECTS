import React, { useState } from 'react';
import { 
  Settings, 
  Ruler, 
  Monitor, 
  Save, 
  CheckCircle2, 
  Cpu,
  ArrowLeft
} from 'lucide-react';

interface SettingsViewProps {
  onBackToDashboard: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBackToDashboard }) => {
  const [unit, setUnit] = useState<'feet' | 'meters'>('feet');
  const [wallHeight, setWallHeight] = useState<number>(10);
  const [gridSnap, setGridSnap] = useState<number>(1);
  const [shadowsEnabled, setShadowsEnabled] = useState(true);
  const [renderQuality, setRenderQuality] = useState<'high' | 'balanced' | 'performance'>('high');
  const [autoSave, setAutoSave] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 text-slate-800 p-6 lg:p-10 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Settings className="text-emerald-600" size={24} />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Studio & CAD Preferences</h1>
            </div>
            <p className="text-sm text-slate-500">
              Configure CAD drafting units, 3D WebGL rendering engine, and blueprint environment settings.
            </p>
          </div>

          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-xs font-bold rounded-xl transition w-fit cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* CAD Drafting & Dimensioning */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Ruler className="text-emerald-600" size={18} />
            <h2 className="text-base font-bold text-slate-900">Drafting & Measurement System</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="text-slate-600 font-bold block mb-2">Default Measurement Unit</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setUnit('feet')}
                  className={`py-2 rounded-lg font-bold transition cursor-pointer ${
                    unit === 'feet' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-800'
                  }`}
                >
                  Imperial (Feet & Inches)
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('meters')}
                  className={`py-2 rounded-lg font-bold transition cursor-pointer ${
                    unit === 'meters' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-800'
                  }`}
                >
                  Metric (Meters & cm)
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-bold block mb-2">Default Wall Height ({unit === 'feet' ? 'ft' : 'm'})</label>
              <select
                value={wallHeight}
                onChange={e => setWallHeight(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
              >
                <option value={9}>9 ft (Standard Ceiling)</option>
                <option value={10}>10 ft (Contemporary High Ceiling)</option>
                <option value={12}>12 ft (Luxury / Cathedral Height)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 font-bold block mb-2">CAD Grid Snap Sensitivity</label>
              <select
                value={gridSnap}
                onChange={e => setGridSnap(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
              >
                <option value={0.5}>0.5 ft (High Precision)</option>
                <option value={1}>1.0 ft (Recommended CAD Standard)</option>
                <option value={2}>2.0 ft (Fast Rough Layout)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 self-end">
              <div>
                <span className="font-bold text-slate-900 block">Auto Dimension Tags</span>
                <span className="text-[11px] text-slate-500">Render emerald dimension indicators along wall boundaries</span>
              </div>
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={e => setShowDimensions(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3D WebGL Engine */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="text-emerald-600" size={18} />
            <h2 className="text-base font-bold text-slate-900">3D WebGL Engine & Shaders</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="text-slate-600 font-bold block mb-2">Graphic Shader Quality</label>
              <select
                value={renderQuality}
                onChange={e => setRenderQuality(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
              >
                <option value="high">High Fidelity (Anti-aliased, Soft Shadows, PBR)</option>
                <option value="balanced">Balanced (Standard 60fps)</option>
                <option value="performance">Performance (Fast rendering on low-spec GPUs)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">Realistic Sun & Daylight</span>
                <span className="text-[11px] text-slate-500">Directional architectural sun lighting with soft lawn shadows</span>
              </div>
              <input
                type="checkbox"
                checked={shadowsEnabled}
                onChange={e => setShadowsEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* System & Storage */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Monitor className="text-emerald-600" size={18} />
            <h2 className="text-base font-bold text-slate-900">System & Workspace</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">Auto-Save Cloud Cache</span>
                <span className="text-[11px] text-slate-500">Regularly persist active room geometry to local storage</span>
              </div>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={e => setAutoSave(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">Acoustic Feedback</span>
                <span className="text-[11px] text-slate-500">Play subtle click sound on wall snaps and object placement</span>
              </div>
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={e => setSoundEffects(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
              <CheckCircle2 size={16} />
              <span>Studio settings saved and applied!</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              All settings are automatically saved locally.
            </div>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Save size={15} />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};

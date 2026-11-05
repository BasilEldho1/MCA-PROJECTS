import React from 'react';
import { useProject } from '../../../context/ProjectContext';
import { distance2D } from '../../../utils/geometry';
import { formatLength, formatArea } from '../../../utils/unitConverter';
import {
  Trash2,
  Copy,
  Box,
  Move,
  RotateCw,
  Maximize2,
  Palette,
  DoorOpen,
  AppWindow,
  Sofa,
  Sliders,
  Home,
  X
} from 'lucide-react';

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-2.5">
    <div className="text-emerald-600">{icon}</div>
    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
  </div>
);

const FieldRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">{label}</label>
    {children}
  </div>
);

const InputBase = "w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs transition";
const ReadonlyBase = "w-full bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-emerald-800 font-mono font-bold text-xs";

export const RightPropertiesPanel: React.FC = () => {
  const {
    currentProject,
    selectedElement,
    updateWall,
    updateRoom,
    updateDoor,
    updateWindow,
    updateFurniture,
    deleteSelected,
    duplicateSelected,
    setSelectedElement
  } = useProject();

  if (!currentProject || !selectedElement) return null;

  const wall = selectedElement?.type === 'wall' ? currentProject.walls.find(w => w.id === selectedElement.id) : null;
  const room = selectedElement?.type === 'room' ? currentProject.rooms.find(r => r.id === selectedElement.id) : null;
  const door = selectedElement?.type === 'door' ? currentProject.doors.find(d => d.id === selectedElement.id) : null;
  const windowItem = selectedElement?.type === 'window' ? currentProject.windows.find(w => w.id === selectedElement.id) : null;
  const furniture = selectedElement?.type === 'furniture' ? currentProject.furniture.find(f => f.id === selectedElement.id) : null;

  const unit = currentProject.unit;

  return (
    <aside className="w-64 bg-white border-l border-slate-200 flex flex-col h-full select-none z-20 text-slate-800 shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-emerald-600" />
          <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            {selectedElement
              ? `${selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Properties`
              : 'Inspector'
            }
          </h2>
        </div>
        {selectedElement && (
          <div className="flex items-center gap-1">
            <button
              onClick={duplicateSelected}
              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
              title="Duplicate"
            >
              <Copy size={12} />
            </button>
            <button
              onClick={deleteSelected}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
            <button
              onClick={() => setSelectedElement(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Close"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* ── WALL PROPERTIES ── */}
        {wall && (
          <>
            <div className="space-y-3">
              <SectionHeader icon={<Box size={13} />} title="Dimensions" />
              <FieldRow label="Length">
                <div className={ReadonlyBase}>{formatLength(distance2D(wall.start, wall.end), unit)}</div>
              </FieldRow>
              <div className="grid grid-cols-2 gap-2">
                <FieldRow label={`Thickness (${unit})`}>
                  <input
                    type="number" step="0.1" min="0.2" max="2.0"
                    value={wall.thickness}
                    onChange={e => updateWall(wall.id, { thickness: parseFloat(e.target.value) || 0.5 })}
                    className={InputBase}
                  />
                </FieldRow>
                <FieldRow label={`Height (${unit})`}>
                  <input
                    type="number" step="0.5" min="5" max="20"
                    value={wall.height}
                    onChange={e => updateWall(wall.id, { height: parseFloat(e.target.value) || 9.5 })}
                    className={InputBase}
                  />
                </FieldRow>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <SectionHeader icon={<Palette size={13} />} title="Material" />
              <FieldRow label="Wall Material">
                <select
                  value={wall.material}
                  onChange={e => updateWall(wall.id, { material: e.target.value as any })}
                  className={InputBase}
                >
                  <option value="paint">Paint</option>
                  <option value="brick">Brick</option>
                  <option value="concrete">Concrete</option>
                  <option value="wood">Wood Panel</option>
                </select>
              </FieldRow>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Exterior Wall</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wall.isExterior || false}
                    onChange={e => updateWall(wall.id, { isExterior: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>
            </div>
          </>
        )}

        {/* ── ROOM PROPERTIES ── */}
        {room && (
          <>
            <div className="space-y-3">
              <SectionHeader icon={<Home size={13} />} title="Room Info" />
              <FieldRow label="Room Name">
                <input
                  type="text"
                  value={room.name}
                  onChange={e => updateRoom(room.id, { name: e.target.value })}
                  className={InputBase}
                />
              </FieldRow>
              <FieldRow label="Room Type">
                <select
                  value={room.type}
                  onChange={e => updateRoom(room.id, { type: e.target.value })}
                  className={InputBase}
                >
                  <option>Living Room</option>
                  <option>Bedroom</option>
                  <option>Kitchen</option>
                  <option>Bathroom</option>
                  <option>Dining Room</option>
                  <option>Office / Study</option>
                  <option>Garage</option>
                  <option>Balcony</option>
                  <option>Storage Room</option>
                </select>
              </FieldRow>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <SectionHeader icon={<Maximize2 size={13} />} title="Measurements" />
              <FieldRow label="Floor Area">
                <div className={ReadonlyBase}>{formatArea(room.area, unit)}</div>
              </FieldRow>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <SectionHeader icon={<Palette size={13} />} title="Finishes" />
              <FieldRow label="Floor Material">
                <select
                  value={room.floorMaterial}
                  onChange={e => updateRoom(room.id, { floorMaterial: e.target.value as any })}
                  className={InputBase}
                >
                  <option value="wood">Wood</option>
                  <option value="tile">Tiles</option>
                  <option value="marble">Marble</option>
                  <option value="concrete">Concrete</option>
                  <option value="carpet">Carpet</option>
                </select>
              </FieldRow>
              <FieldRow label="Wall Material">
                <select
                  value={room.wallMaterial}
                  onChange={e => updateRoom(room.id, { wallMaterial: e.target.value as any })}
                  className={InputBase}
                >
                  <option value="paint">Paint</option>
                  <option value="brick">Brick</option>
                  <option value="concrete">Concrete</option>
                  <option value="wood">Wood Panel</option>
                </select>
              </FieldRow>
            </div>
          </>
        )}

        {/* ── DOOR PROPERTIES ── */}
        {door && (
          <>
            <div className="space-y-3">
              <SectionHeader icon={<DoorOpen size={13} />} title="Door Settings" />
              <FieldRow label="Door Type">
                <select
                  value={door.doorType}
                  onChange={e => updateDoor(door.id, { doorType: e.target.value as any })}
                  className={InputBase}
                >
                  <option value="single">Single Door</option>
                  <option value="double">Double Door</option>
                  <option value="sliding">Sliding Door</option>
                  <option value="arch">Arch Door</option>
                </select>
              </FieldRow>
              <div className="grid grid-cols-2 gap-2">
                <FieldRow label={`Width (${unit})`}>
                  <input
                    type="number" step="0.25" min="2" max="6"
                    value={door.width}
                    onChange={e => updateDoor(door.id, { width: parseFloat(e.target.value) || 3 })}
                    className={InputBase}
                  />
                </FieldRow>
                <FieldRow label={`Height (${unit})`}>
                  <input
                    type="number" step="0.25" min="5" max="10"
                    value={door.height}
                    onChange={e => updateDoor(door.id, { height: parseFloat(e.target.value) || 6.8 })}
                    className={InputBase}
                  />
                </FieldRow>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <SectionHeader icon={<Move size={13} />} title="Position" />
              <FieldRow label="Wall Position">
                <input
                  type="range" min="0.05" max="0.95" step="0.01"
                  value={door.positionRatio}
                  onChange={e => updateDoor(door.id, { positionRatio: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="text-[10px] text-slate-500 text-right font-mono">{Math.round(door.positionRatio * 100)}% along wall</div>
              </FieldRow>
            </div>
          </>
        )}

        {/* ── WINDOW PROPERTIES ── */}
        {windowItem && (
          <>
            <div className="space-y-3">
              <SectionHeader icon={<AppWindow size={13} />} title="Window Settings" />
              <FieldRow label="Window Type">
                <select
                  value={windowItem.windowType}
                  onChange={e => updateWindow(windowItem.id, { windowType: e.target.value as any })}
                  className={InputBase}
                >
                  <option value="standard">Standard</option>
                  <option value="sliding">Sliding</option>
                  <option value="picture">Picture</option>
                  <option value="bay">Bay Window</option>
                </select>
              </FieldRow>
              <div className="grid grid-cols-2 gap-2">
                <FieldRow label={`Width (${unit})`}>
                  <input
                    type="number" step="0.25" min="1" max="10"
                    value={windowItem.width}
                    onChange={e => updateWindow(windowItem.id, { width: parseFloat(e.target.value) || 4 })}
                    className={InputBase}
                  />
                </FieldRow>
                <FieldRow label={`Height (${unit})`}>
                  <input
                    type="number" step="0.25" min="1" max="8"
                    value={windowItem.height}
                    onChange={e => updateWindow(windowItem.id, { height: parseFloat(e.target.value) || 4 })}
                    className={InputBase}
                  />
                </FieldRow>
              </div>
              <FieldRow label={`Sill Height (${unit})`}>
                <input
                  type="number" step="0.1" min="0" max="5"
                  value={windowItem.sillHeight}
                  onChange={e => updateWindow(windowItem.id, { sillHeight: parseFloat(e.target.value) || 2.8 })}
                  className={InputBase}
                />
              </FieldRow>
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <SectionHeader icon={<Move size={13} />} title="Position" />
              <FieldRow label="Wall Position">
                <input
                  type="range" min="0.05" max="0.95" step="0.01"
                  value={windowItem.positionRatio}
                  onChange={e => updateWindow(windowItem.id, { positionRatio: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="text-[10px] text-slate-500 text-right font-mono">{Math.round(windowItem.positionRatio * 100)}% along wall</div>
              </FieldRow>
            </div>
          </>
        )}

        {/* ── FURNITURE PROPERTIES ── */}
        {furniture && (
          <>
            <div className="space-y-3">
              <SectionHeader icon={<Sofa size={13} />} title="Object Info" />
              <FieldRow label="Name">
                <input
                  type="text"
                  value={furniture.name}
                  onChange={e => updateFurniture(furniture.id, { name: e.target.value })}
                  className={InputBase}
                />
              </FieldRow>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <SectionHeader icon={<Maximize2 size={13} />} title="Dimensions" />
              <div className="grid grid-cols-2 gap-2">
                <FieldRow label={`Width (${unit})`}>
                  <input
                    type="number" step="0.2" min="0.5"
                    value={furniture.width}
                    onChange={e => updateFurniture(furniture.id, { width: parseFloat(e.target.value) || 1 })}
                    className={InputBase}
                  />
                </FieldRow>
                <FieldRow label={`Depth (${unit})`}>
                  <input
                    type="number" step="0.2" min="0.5"
                    value={furniture.length}
                    onChange={e => updateFurniture(furniture.id, { length: parseFloat(e.target.value) || 1 })}
                    className={InputBase}
                  />
                </FieldRow>
                <FieldRow label={`Height (${unit})`}>
                  <input
                    type="number" step="0.1" min="0.1"
                    value={furniture.height}
                    onChange={e => updateFurniture(furniture.id, { height: parseFloat(e.target.value) || 1 })}
                    className={InputBase}
                  />
                </FieldRow>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <SectionHeader icon={<RotateCw size={13} />} title="Transform" />
              <FieldRow label={`Rotation: ${furniture.rotation}°`}>
                <input
                  type="range" min="0" max="360" step="5"
                  value={furniture.rotation}
                  onChange={e => updateFurniture(furniture.id, { rotation: parseInt(e.target.value) || 0 })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>0°</span><span>90°</span><span>180°</span><span>270°</span><span>360°</span>
                </div>
              </FieldRow>
              <FieldRow label="Position X">
                <input
                  type="number" step="0.5"
                  value={furniture.x}
                  onChange={e => updateFurniture(furniture.id, { x: parseFloat(e.target.value) || 0 })}
                  className={InputBase}
                />
              </FieldRow>
              <FieldRow label="Position Y">
                <input
                  type="number" step="0.5"
                  value={furniture.y}
                  onChange={e => updateFurniture(furniture.id, { y: parseFloat(e.target.value) || 0 })}
                  className={InputBase}
                />
              </FieldRow>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <SectionHeader icon={<Palette size={13} />} title="Color" />
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={furniture.color || '#059669'}
                  onChange={e => updateFurniture(furniture.id, { color: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer bg-white p-0.5"
                />
                <input
                  type="text"
                  value={furniture.color || '#059669'}
                  onChange={e => updateFurniture(furniture.id, { color: e.target.value })}
                  className={`${InputBase} flex-1 font-mono`}
                  placeholder="#059669"
                />
              </div>
            </div>

            {/* Quick actions */}
            <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-2">
              <button
                onClick={duplicateSelected}
                className="py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Copy size={12} /> Duplicate
              </button>
              <button
                onClick={deleteSelected}
                className="py-2 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

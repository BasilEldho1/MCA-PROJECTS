import React, { useState } from 'react';
import { useProject } from '../../../context/ProjectContext';
import { FurnitureCategory, ToolMode } from '../../../types/floorplan';
import { FURNITURE_CATALOG } from '../../../utils/furnitureCatalog';
import { EditorBuildPanel } from './EditorBuildPanel';
import {
  MousePointer,
  Hammer,
  Sofa,
  DoorOpen,
  AppWindow,
  Palette,
  Ruler,
  Layers,
  Search,
  Plus,
  FileUp,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Bed,
  Utensils,
  ChefHat,
  Bath,
  Laptop,
  Flower2,
  Settings,
  HelpCircle
} from 'lucide-react';

type NavSection =
  | 'select'
  | 'build'
  | 'objects'
  | 'furniture'
  | 'doors'
  | 'windows'
  | 'materials'
  | 'measurements'
  | 'layers'
  | 'settings'
  | 'help';

interface NavItem {
  id: NavSection;
  icon: React.ElementType;
  label: string;
  toolMode?: ToolMode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'select',       icon: MousePointer, label: 'Select',       toolMode: 'select' },
  { id: 'build',        icon: Hammer,       label: 'Build' },
  { id: 'furniture',    icon: Sofa,         label: 'Objects' },
  { id: 'doors',        icon: DoorOpen,     label: 'Doors',        toolMode: 'door' },
  { id: 'windows',      icon: AppWindow,    label: 'Windows',      toolMode: 'window' },
];

const DOOR_TYPES = [
  { id: 'single', label: 'Single Door', desc: 'Standard interior/exterior door' },
  { id: 'double', label: 'Double Door', desc: 'Wide double-leaf door' },
  { id: 'sliding', label: 'Sliding Door', desc: 'Space-saving sliding track' },
  { id: 'arch', label: 'Arch Door', desc: 'Decorative arched entrance' },
];

const WINDOW_TYPES = [
  { id: 'standard', label: 'Standard Window', desc: 'Classic single pane' },
  { id: 'sliding', label: 'Sliding Window', desc: 'Horizontal sliding panels' },
  { id: 'picture', label: 'Picture Window', desc: 'Large fixed glass pane' },
  { id: 'bay', label: 'Bay Window', desc: 'Protruding bay window set' },
];

const MATERIAL_PRESETS = {
  wall: [
    { id: 'paint', label: 'Paint', color: '#f8fafc' },
    { id: 'brick', label: 'Brick', color: '#b45309' },
    { id: 'concrete', label: 'Concrete', color: '#94a3b8' },
    { id: 'wood', label: 'Wood', color: '#a16207' },
  ],
  floor: [
    { id: 'tile', label: 'Tiles', color: '#cbd5e1' },
    { id: 'marble', label: 'Marble', color: '#e2e8f0' },
    { id: 'wood', label: 'Wood', color: '#92400e' },
    { id: 'concrete', label: 'Concrete', color: '#6b7280' },
  ]
};

export const LeftSidebar: React.FC = () => {
  const {
    toolMode,
    setToolMode,
    setSelectedFurnitureCatalogId,
    selectedFurnitureCatalogId,
    addRoom,
    addFurniture,
    deleteSelected,
    selectedElement,
    currentProject,
    setActiveView,
    setBlueprintOverlay,
    updateBlueprintOverlay,
    importProjectJSON
  } = useProject();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [activeSection, setActiveSection] = useState<NavSection>('build');
  const [activeCategory, setActiveCategory] = useState<FurnitureCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customRoomName, setCustomRoomName] = useState('Living Room');
  const [customRoomType, setCustomRoomType] = useState('Living Room');

  const filteredFurniture = FURNITURE_CATALOG.filter((item: any) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleNavClick = (item: NavItem) => {
    setActiveSection(item.id);
    if (item.toolMode) {
      setToolMode(item.toolMode);
    }
    if (item.id === 'furniture') {
      setToolMode('furniture');
    }
  };

  const handleSelectFurniture = (catalogId: string) => {
    setSelectedFurnitureCatalogId(catalogId);
    setToolMode('furniture');
  };

  const handleQuickAddRoom = () => {
    if (!currentProject) return;
    const w = currentProject.plotWidth;
    const l = currentProject.plotLength;
    const rw = Math.min(15, Math.max(10, w / 3));
    const rl = Math.min(15, Math.max(10, l / 3));
    const startX = (w - rw) / 2;
    const startY = (l - rl) / 2;
    addRoom(customRoomName, customRoomType, [
      { x: startX, y: startY },
      { x: startX + rw, y: startY },
      { x: startX + rw, y: startY + rl },
      { x: startX, y: startY + rl }
    ]);
  };

  const handleAddStairs = (type: string) => {
    if (!currentProject) return;
    addFurniture({
      name: `${type} Stairs`,
      category: 'stairs',
      x: currentProject.plotWidth / 2,
      y: currentProject.plotLength / 2,
      width: 4,
      length: 8,
      height: 9,
      rotation: 0,
      color: '#059669'
    });
  };

  const handleSidebarFile = (file: File) => {
    if (!currentProject) return;
    if (file.name.endsWith('.json') || file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        if (content) importProjectJSON(content);
      };
      reader.readAsText(file);
      return;
    }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const testImg = new Image();
          testImg.onload = () => {
            const plotW = currentProject.plotWidth || 40;
            const plotL = currentProject.plotLength || 30;
            const imgAspect = (testImg.naturalWidth || 1) / (testImg.naturalHeight || 1);
            const plotAspect = plotW / plotL;
            let overlayW = plotW, overlayH = plotL, offsetX = 0, offsetY = 0;
            if (imgAspect > plotAspect) {
              overlayW = plotW; overlayH = plotW / imgAspect; offsetY = (plotL - overlayH) / 2;
            } else {
              overlayH = plotL; overlayW = plotL * imgAspect; offsetX = (plotW - overlayW) / 2;
            }
            setBlueprintOverlay({
              imageUrl: dataUrl, opacity: 0.5,
              x: Math.round(offsetX * 10) / 10, y: Math.round(offsetY * 10) / 10,
              width: Math.round(overlayW * 10) / 10, height: Math.round(overlayH * 10) / 10,
              visible: true
            });
            setActiveView('2D');
          };
          testImg.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSecondaryPanel = () => {
    switch (activeSection) {
      // ─── BUILD ───────────────────────────────────────────────────────────
      case 'build':
        return (
          <div className="flex flex-col h-full">
            <EditorBuildPanel />
            {/* Stairs sub-section */}
            {toolMode === 'stairs' && (
              <div className="border-t border-slate-100 p-3 space-y-2 bg-violet-50/30">
                <h4 className="text-[10px] font-bold text-violet-800 uppercase tracking-wider">Staircase Styles</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Straight', 'L-Shaped', 'U-Shaped', 'Spiral'].map(type => (
                    <button
                      key={type}
                      onClick={() => handleAddStairs(type)}
                      className="p-2 bg-white hover:bg-violet-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold text-center transition cursor-pointer"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // ─── OBJECTS / FURNITURE ─────────────────────────────────────────────
      case 'furniture':
        return (
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Object Library</h3>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search objects..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
              {/* Category pills */}
              <div className="flex gap-1 flex-wrap">
                {[
                  { id: 'all', label: 'All', icon: Sofa },
                  { id: 'bedroom', label: 'Bed', icon: Bed },
                  { id: 'living', label: 'Living', icon: Sofa },
                  { id: 'dining', label: 'Dining', icon: Utensils },
                  { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
                  { id: 'bathroom', label: 'Bath', icon: Bath },
                  { id: 'office', label: 'Office', icon: Laptop },
                  { id: 'stairs', label: 'Stairs', icon: Layers },
                  { id: 'outdoor', label: 'Misc', icon: Flower2 }
                ].map((cat: any) => {
                  const Icon = cat.icon;
                  const isAct = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id as any)}
                      className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap transition cursor-pointer ${
                        isAct ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                    >
                      <Icon size={10} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {/* Room Specific Furniture Recommendations */}
              {selectedElement?.type === 'room' && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl mb-2">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles size={11} className="text-emerald-600" />
                    <span>Recommended for Selected Room</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {FURNITURE_CATALOG.slice(0, 4).map(item => (
                      <button
                        key={`rec_${item.id}`}
                        onClick={() => handleSelectFurniture(item.id)}
                        className="p-1.5 bg-white hover:bg-emerald-100/60 border border-emerald-200 rounded-lg font-semibold text-slate-800 text-left truncate transition"
                      >
                        + {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                <span>Library</span>
                <span>{filteredFurniture.length} items</span>
              </div>
              {filteredFurniture.map((item: any) => {
                const isSelected = toolMode === 'furniture' && selectedFurnitureCatalogId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectFurniture(item.id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: item.defaultColor || '#059669' }}
                      >
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900">{item.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.defaultWidth} × {item.defaultLength} {currentProject?.unit}
                        </p>
                      </div>
                    </div>
                    <button className={`p-1 rounded-md transition ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-800'}`}>
                      <Plus size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      // ─── DOORS ─────────────────────────────────────────────────────────
      case 'doors':
        return (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Door Library</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Hover a wall and click to place</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {DOOR_TYPES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setToolMode('door')}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                    toolMode === 'door' ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toolMode === 'door' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                    <DoorOpen size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{d.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{d.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800">
                → Select a door style then hover over any wall segment and click to place it.
              </div>
            </div>
          </div>
        );

      // ─── WINDOWS ────────────────────────────────────────────────────────
      case 'windows':
        return (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Window Library</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Hover a wall and click to place</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {WINDOW_TYPES.map(w => (
                <button
                  key={w.id}
                  onClick={() => setToolMode('window')}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                    toolMode === 'window' ? 'bg-sky-50 border-sky-300' : 'bg-white border-slate-200 hover:border-sky-200 hover:bg-sky-50/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toolMode === 'window' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'}`}>
                    <AppWindow size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{w.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{w.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100">
              <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-[10px] text-sky-800">
                → Select a window style then hover over any wall segment and click to place it.
              </div>
            </div>
          </div>
        );

      // ─── MATERIALS ──────────────────────────────────────────────────────
      case 'materials':
        return (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Materials</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Select object first, then apply material</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Wall Materials</h4>
                <div className="grid grid-cols-2 gap-2">
                  {MATERIAL_PRESETS.wall.map(m => (
                    <button
                      key={m.id}
                      className="flex items-center gap-2 p-2 bg-white border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-md border border-slate-200" style={{ backgroundColor: m.color }} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Floor Materials</h4>
                <div className="grid grid-cols-2 gap-2">
                  {MATERIAL_PRESETS.floor.map(m => (
                    <button
                      key={m.id}
                      className="flex items-center gap-2 p-2 bg-white border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-md border border-slate-200" style={{ backgroundColor: m.color }} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      // ─── MEASUREMENTS ───────────────────────────────────────────────────
      case 'measurements':
        return (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Measurements</h3>
            </div>
            <div className="flex-1 p-3 space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 leading-relaxed">
                <p className="font-bold mb-1">CAD Measurement Tool</p>
                <p>Click any two points on the 2D canvas to measure exact distance and angle in real-time.</p>
              </div>
              <button
                onClick={() => setToolMode('measurement')}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  toolMode === 'measurement'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200'
                }`}
              >
                {toolMode === 'measurement' ? '✓ Measurement Tool Active' : 'Activate Measurement Tool'}
              </button>
              {currentProject && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Metrics</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Walls</span>
                      <span className="text-base font-bold text-emerald-700">{currentProject.walls.length}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Rooms</span>
                      <span className="text-base font-bold text-emerald-700">{currentProject.rooms.length}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Openings</span>
                      <span className="text-base font-bold text-emerald-700">{currentProject.doors.length + currentProject.windows.length}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Objects</span>
                      <span className="text-base font-bold text-emerald-700">{currentProject.furniture.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // ─── LAYERS ─────────────────────────────────────────────────────────
      case 'layers':
        return (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Layers</h3>
            </div>
            <div className="flex-1 p-3 space-y-2">
              {[
                { label: 'Walls', count: currentProject?.walls.length ?? 0, color: '#0f172a' },
                { label: 'Rooms', count: currentProject?.rooms.length ?? 0, color: '#059669' },
                { label: 'Doors', count: currentProject?.doors.length ?? 0, color: '#b45309' },
                { label: 'Windows', count: currentProject?.windows.length ?? 0, color: '#0284c7' },
                { label: 'Furniture', count: currentProject?.furniture.length ?? 0, color: '#7c3aed' },
              ].map(layer => (
                <div key={layer.label} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: layer.color }} />
                    <span className="text-xs font-semibold text-slate-800">{layer.label}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">{layer.count}</span>
                </div>
              ))}

              {/* Blueprint overlay */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Reference</h4>
                {!currentProject?.blueprintOverlay ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <FileUp size={13} className="text-emerald-600" />
                    Import Blueprint
                  </button>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={13} className="text-emerald-700" />
                      <span className="text-[11px] text-emerald-900 font-medium">Blueprint Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateBlueprintOverlay({ visible: !currentProject.blueprintOverlay?.visible })}
                        className="p-1 text-slate-500 hover:text-emerald-700 rounded"
                      >
                        {currentProject.blueprintOverlay.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      <button
                        onClick={() => setBlueprintOverlay(null)}
                        className="p-1 text-rose-500 hover:text-rose-700 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ─── SETTINGS ───────────────────────────────────────────────────────
      case 'settings':
        return (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Canvas Settings</h3>
            </div>
            <div className="flex-1 p-3 space-y-3">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Import / Export</h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 py-2 px-3 bg-slate-50 hover:bg-emerald-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <FileUp size={13} className="text-emerald-600" />
                    Import Blueprint / JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      // ─── HELP ────────────────────────────────────────────────────────────
      case 'help':
        return (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Help & Shortcuts</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {[
                { key: 'Ctrl+Z', label: 'Undo last action' },
                { key: 'Ctrl+Y', label: 'Redo action' },
                { key: 'Delete', label: 'Delete selected' },
                { key: 'Scroll', label: 'Zoom in/out' },
                { key: 'Right-click drag', label: 'Pan canvas' },
                { key: 'Shift+drag', label: 'Pan canvas' },
                { key: 'W', label: 'Quick select Wall tool' },
                { key: 'S', label: 'Quick select tool' },
                { key: 'Esc', label: 'Cancel current draw' },
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-600">{s.label}</span>
                  <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded-md text-[10px] font-mono font-bold text-slate-700">{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        );

      // ─── SELECT (default) ────────────────────────────────────────────────
      default:
        return (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Tool</h3>
            </div>
            <div className="flex-1 p-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                Click any element on the canvas to select it. Selected objects can be moved, rotated, and edited in the Properties panel on the right.
              </div>
              {selectedElement && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                  <span className="font-bold capitalize">{selectedElement.type}</span> selected. Edit its properties in the right panel.
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.json"
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            handleSidebarFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Two-column sidebar: slim icon rail + secondary panel */}
      <aside className="flex h-full select-none z-20 text-slate-800 border-r border-slate-200 shadow-sm">
        {/* ── Icon Rail ── */}
        <div className="w-16 bg-white border-r border-slate-100 flex flex-col items-center py-2 gap-1 shrink-0">
          {/* Logo mark */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mb-2 shadow-md shadow-emerald-600/20">
            <Layers size={16} className="text-white" />
          </div>

          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                title={item.label}
                className={`relative w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition cursor-pointer group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-emerald-700'
                }`}
              >
                <Icon size={16} />
                <span className={`text-[8px] font-bold leading-none ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                {/* Tooltip on hover */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                  {item.label}
                </div>
              </button>
            );
          })}

          {/* Delete button at bottom */}
          <div className="mt-auto mb-1">
            <button
              onClick={deleteSelected}
              title="Delete Selected"
              className="w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
            >
              <Trash2 size={16} />
              <span className="text-[8px] font-bold leading-none text-slate-400">Delete</span>
            </button>
          </div>
        </div>

        {/* ── Secondary Flyout Panel ── */}
        <div className="w-56 bg-white flex flex-col h-full overflow-hidden">
          {renderSecondaryPanel()}
        </div>
      </aside>
    </>
  );
};

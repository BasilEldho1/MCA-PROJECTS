import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  FolderGit2, 
  Search, 
  Plus, 
  Box, 
  MoreVertical,
  Trash2,
  Copy,
  Share2,
  Compass,
  Eye
} from 'lucide-react';
import { Project } from '../../types/floorplan';

interface MyProjectsViewProps {
  onOpenEditor: (projectId: string, initialMode?: '2D' | '3D') => void;
  onOpenNewProjectModal: () => void;
  onOpenShareModal: (projectId?: string) => void;
  onBackToDashboard?: () => void;
}

// Dedicated distinctive blueprint visualizer for each architectural house style
const DistinctBlueprintThumbnail: React.FC<{ project: Project }> = ({ project }) => {
  const type = (project.houseType || '').toLowerCase();
  const name = project.name.toLowerCase();

  // 1. Traditional Kerala Nalukettu Courtyard Blueprint (Archetype Priority)
  if (type.includes('kerala') || type.includes('traditional') || type.includes('nalukettu') || name.includes('kerala') || name.includes('nalukettu')) {
    return (
      <svg viewBox="0 0 240 150" className="w-full h-full">
        {/* Outer boundary */}
        <rect x="20" y="15" width="200" height="120" fill="none" stroke="#d97706" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.4" />
        {/* Poomukham Front Verandah */}
        <rect x="25" y="20" width="190" height="26" fill="#d97706" fillOpacity="0.08" stroke="#b45309" strokeWidth="1.6" rx="2" />
        <text x="120" y="36" fill="#92400e" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">POOMUKHAM (VERANDAH)</text>
        {/* Wooden Pillars */}
        {[45, 80, 120, 160, 195].map((x, i) => (
          <circle key={i} cx={x} cy={33} r="2.2" fill="#b45309" />
        ))}
        {/* Central Nadumuttam Open-to-sky Courtyard */}
        <rect x="90" y="55" width="60" height="42" fill="#10b981" fillOpacity="0.12" stroke="#059669" strokeWidth="1.8" rx="2" />
        <text x="120" y="75" fill="#047857" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">NADUMUTTAM</text>
        <text x="120" y="85" fill="#059669" fontSize="6.5" fontFamily="monospace" textAnchor="middle">[OPEN COURTYARD]</text>
        {/* East Living Hall */}
        <rect x="25" y="46" width="65" height="46" fill="#d97706" fillOpacity="0.06" stroke="#b45309" strokeWidth="1.2" rx="2" />
        <text x="57" y="71" fill="#78350f" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">EAST HALL</text>
        {/* Pooja Room */}
        <rect x="25" y="92" width="65" height="38" fill="#f59e0b" fillOpacity="0.1" stroke="#d97706" strokeWidth="1.2" rx="2" />
        <text x="57" y="113" fill="#b45309" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">POOJA ROOM</text>
        {/* Thekkini Master Suite */}
        <rect x="150" y="46" width="65" height="46" fill="#92400e" fillOpacity="0.06" stroke="#b45309" strokeWidth="1.2" rx="2" />
        <text x="182" y="71" fill="#78350f" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">THEKKINI BED</text>
        {/* Adukkala Kitchen */}
        <rect x="90" y="97" width="125" height="33" fill="#d97706" fillOpacity="0.06" stroke="#b45309" strokeWidth="1.2" rx="2" />
        <text x="152" y="116" fill="#78350f" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">ADUKKALA (KITCHEN)</text>
      </svg>
    );
  }

  // 2. Luxury Villa Blueprint
  if (type.includes('villa') || (!type.includes('kerala') && name.includes('villa'))) {
    return (
      <svg viewBox="0 0 240 150" className="w-full h-full">
        {/* Plot perimeter */}
        <rect x="15" y="15" width="210" height="120" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" opacity="0.3" />
        {/* Main Living Hall */}
        <rect x="25" y="25" width="115" height="65" fill="#10b981" fillOpacity="0.08" stroke="#10b981" strokeWidth="1.8" rx="2" />
        <text x="82" y="58" fill="#047857" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">GRAND LIVING</text>
        {/* Island Kitchen */}
        <rect x="140" y="25" width="75" height="55" fill="#0284c7" fillOpacity="0.08" stroke="#0284c7" strokeWidth="1.5" rx="2" />
        <text x="177" y="54" fill="#0369a1" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">ISLAND KITCHEN</text>
        {/* Master Suite */}
        <rect x="25" y="90" width="85" height="45" fill="#8b5cf6" fillOpacity="0.08" stroke="#8b5cf6" strokeWidth="1.5" rx="2" />
        <text x="67" y="114" fill="#6d28d9" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">MASTER SUITE</text>
        {/* Ensuite Bath */}
        <rect x="110" y="90" width="40" height="45" fill="#64748b" fillOpacity="0.08" stroke="#64748b" strokeWidth="1.2" rx="2" />
        <text x="130" y="114" fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">BATH</text>
        {/* Swimming Pool Deck */}
        <rect x="150" y="80" width="65" height="55" fill="#38bdf8" fillOpacity="0.15" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 2" rx="3" />
        <text x="182" y="105" fill="#0284c7" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">POOL PATIO</text>
        {/* Water wave accent */}
        <path d="M 160 115 Q 170 112 180 115 T 200 115" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.8" />
      </svg>
    );
  }

  // 3. Contemporary Duplex Blueprint
  if (name.includes('duplex') || type.includes('duplex')) {
    return (
      <svg viewBox="0 0 240 150" className="w-full h-full">
        {/* Double-Height Great Hall */}
        <rect x="25" y="20" width="120" height="60" fill="#0284c7" fillOpacity="0.08" stroke="#0284c7" strokeWidth="1.8" rx="2" />
        <text x="85" y="48" fill="#0369a1" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">DOUBLE-HEIGHT HALL</text>
        <text x="85" y="60" fill="#0284c7" fontSize="7" fontFamily="monospace" textAnchor="middle">[ATRIUM VOID]</text>
        {/* Floating Staircase */}
        <g stroke="#0284c7" strokeWidth="1" opacity="0.7">
          {[25, 32, 39, 46, 53, 60].map((y, i) => (
            <line key={i} x1="145" y1={y} x2="175" y2={y} strokeDasharray="1 1" />
          ))}
          <rect x="145" y="20" width="30" height="50" fill="none" stroke="#0284c7" strokeWidth="1.2" />
          <text x="160" y="78" fill="#0369a1" fontSize="6.5" fontFamily="monospace" textAnchor="middle">STAIRS</text>
        </g>
        {/* Chef Kitchen */}
        <rect x="175" y="20" width="45" height="55" fill="#10b981" fillOpacity="0.08" stroke="#10b981" strokeWidth="1.4" rx="2" />
        <text x="197" y="50" fill="#047857" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">CHEF</text>
        <text x="197" y="60" fill="#047857" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">KITCHEN</text>
        {/* Ground Floor Bedroom */}
        <rect x="25" y="80" width="95" height="50" fill="#6366f1" fillOpacity="0.08" stroke="#6366f1" strokeWidth="1.5" rx="2" />
        <text x="72" y="108" fill="#4338ca" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">GROUND SUITE</text>
        {/* Terrace Garden Deck */}
        <rect x="120" y="80" width="100" height="50" fill="#10b981" fillOpacity="0.1" stroke="#059669" strokeWidth="1.5" rx="2" />
        <text x="170" y="108" fill="#047857" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">TERRACE BALCONY</text>
      </svg>
    );
  }

  // 4. Scandinavian Bungalow Blueprint
  if (name.includes('scandinavian') || name.includes('bungalow') || type.includes('bungalow')) {
    return (
      <svg viewBox="0 0 240 150" className="w-full h-full">
        {/* Nordic Great Room */}
        <rect x="25" y="25" width="100" height="60" fill="#f59e0b" fillOpacity="0.08" stroke="#d97706" strokeWidth="1.6" rx="2" />
        <text x="75" y="52" fill="#b45309" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">NORDIC LIVING</text>
        <text x="75" y="64" fill="#d97706" fontSize="7" fontFamily="monospace" textAnchor="middle">[FIREPLACE NOOK]</text>
        {/* Galley Kitchen */}
        <rect x="25" y="85" width="100" height="45" fill="#64748b" fillOpacity="0.08" stroke="#64748b" strokeWidth="1.4" rx="2" />
        <text x="75" y="110" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">MINIMALIST KITCHEN</text>
        {/* Primary Glass Bedroom */}
        <rect x="125" y="25" width="90" height="55" fill="#3b82f6" fillOpacity="0.08" stroke="#2563eb" strokeWidth="1.5" rx="2" />
        <text x="170" y="52" fill="#1d4ed8" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">GLASS BEDROOM</text>
        {/* Glass Sliding Wall Indicator */}
        <line x1="125" y1="25" x2="215" y2="25" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
        {/* Cedar Sauna & Spa */}
        <rect x="125" y="80" width="90" height="50" fill="#d97706" fillOpacity="0.12" stroke="#b45309" strokeWidth="1.4" rx="2" />
        <text x="170" y="105" fill="#92400e" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">CEDAR SAUNA & SPA</text>
      </svg>
    );
  }

  // 5. Compact Micro-Home Blueprint
  if (name.includes('compact') || name.includes('micro') || type.includes('compact') || type.includes('micro')) {
    return (
      <svg viewBox="0 0 240 150" className="w-full h-full">
        {/* Studio Living Zone */}
        <rect x="35" y="25" width="170" height="55" fill="#10b981" fillOpacity="0.08" stroke="#059669" strokeWidth="1.6" rx="2" />
        <text x="120" y="52" fill="#047857" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">CONVERTIBLE STUDIO LOUNGE</text>
        <text x="120" y="64" fill="#059669" fontSize="7" fontFamily="monospace" textAnchor="middle">[SMART SPACE OPTIMIZED]</text>
        {/* Modular Kitchenette */}
        <rect x="35" y="80" width="80" height="48" fill="#0284c7" fillOpacity="0.08" stroke="#0284c7" strokeWidth="1.4" rx="2" />
        <text x="75" y="106" fill="#0369a1" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">MODULAR KITCHEN</text>
        {/* Alcove Bed & Bath */}
        <rect x="115" y="80" width="90" height="48" fill="#8b5cf6" fillOpacity="0.08" stroke="#7c3aed" strokeWidth="1.4" rx="2" />
        <text x="160" y="100" fill="#6d28d9" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">ALCOVE BED</text>
        <text x="160" y="114" fill="#7c3aed" fontSize="6.5" fontFamily="monospace" textAnchor="middle">WET BATHROOM</text>
      </svg>
    );
  }

  // 6. Modern Farmhouse Blueprint
  if (name.includes('farmhouse') || type.includes('farmhouse')) {
    return (
      <svg viewBox="0 0 240 150" className="w-full h-full">
        {/* Wraparound Porch Perimeter */}
        <rect x="20" y="20" width="200" height="24" fill="#78350f" fillOpacity="0.08" stroke="#92400e" strokeWidth="1.5" rx="2" />
        <text x="120" y="35" fill="#78350f" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">WRAPAROUND FRONT PORCH</text>
        {/* Gabled Great Room */}
        <rect x="25" y="44" width="105" height="52" fill="#d97706" fillOpacity="0.08" stroke="#b45309" strokeWidth="1.6" rx="2" />
        <text x="77" y="70" fill="#92400e" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">GABLED GREAT ROOM</text>
        <text x="77" y="82" fill="#b45309" fontSize="6.5" fontFamily="monospace" textAnchor="middle">[STONE HEARTH]</text>
        {/* Country Kitchen */}
        <rect x="130" y="44" width="85" height="52" fill="#059669" fillOpacity="0.08" stroke="#059669" strokeWidth="1.4" rx="2" />
        <text x="172" y="72" fill="#047857" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">COUNTRY KITCHEN</text>
        {/* Downstairs Master */}
        <rect x="25" y="96" width="95" height="36" fill="#6366f1" fillOpacity="0.08" stroke="#4f46e5" strokeWidth="1.4" rx="2" />
        <text x="72" y="117" fill="#4338ca" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">MASTER SUITE</text>
        {/* Sunroom */}
        <rect x="120" y="96" width="95" height="36" fill="#10b981" fillOpacity="0.1" stroke="#059669" strokeWidth="1.4" rx="2" />
        <text x="167" y="117" fill="#047857" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">SCREENED SUNROOM</text>
      </svg>
    );
  }

  // 7. Mediterranean Villa Blueprint
  if (name.includes('mediterranean') || type.includes('mediterranean')) {
    return (
      <svg viewBox="0 0 240 150" className="w-full h-full">
        {/* Arched Loggia Front */}
        <rect x="25" y="20" width="80" height="45" fill="#ea580c" fillOpacity="0.08" stroke="#c2410c" strokeWidth="1.5" rx="2" />
        <text x="65" y="44" fill="#9a3412" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">ARCHED LOGGIA</text>
        {/* Living Hall */}
        <rect x="105" y="20" width="110" height="55" fill="#f59e0b" fillOpacity="0.08" stroke="#d97706" strokeWidth="1.6" rx="2" />
        <text x="160" y="48" fill="#b45309" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">SUNLIT LIVING HALL</text>
        {/* Central Fountain Patio */}
        <rect x="25" y="65" width="80" height="60" fill="#0284c7" fillOpacity="0.08" stroke="#0284c7" strokeWidth="1.5" rx="2" />
        <text x="65" y="92" fill="#0369a1" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">PATIO COURTYARD</text>
        <circle cx="65" cy="106" r="6" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
        {/* Sea-Breeze Bedroom */}
        <rect x="105" y="75" width="110" height="50" fill="#8b5cf6" fillOpacity="0.08" stroke="#7c3aed" strokeWidth="1.5" rx="2" />
        <text x="160" y="103" fill="#6d28d9" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">SEA-VIEW BEDROOM</text>
      </svg>
    );
  }

  // 8. Industrial Loft Blueprint
  if (name.includes('loft') || type.includes('loft') || name.includes('industrial')) {
    return (
      <svg viewBox="0 0 240 150" className="w-full h-full">
        {/* Open Great Hall */}
        <rect x="25" y="20" width="190" height="65" fill="#475569" fillOpacity="0.08" stroke="#334155" strokeWidth="1.8" rx="2" />
        <text x="120" y="48" fill="#1e293b" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">OPEN INDUSTRIAL GREAT HALL</text>
        <text x="120" y="60" fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">[EXPOSED BEAMS & POLISHED CONCRETE]</text>
        {/* Commercial Kitchen */}
        <rect x="25" y="85" width="90" height="45" fill="#0284c7" fillOpacity="0.08" stroke="#0284c7" strokeWidth="1.4" rx="2" />
        <text x="70" y="110" fill="#0369a1" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">COMMERCIAL KITCHEN</text>
        {/* Mezzanine Penthouse */}
        <rect x="115" y="85" width="100" height="45" fill="#f59e0b" fillOpacity="0.08" stroke="#d97706" strokeWidth="1.4" rx="2" />
        <text x="165" y="110" fill="#b45309" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">MEZZANINE SUITE</text>
      </svg>
    );
  }

  // Default dynamic room layout fallback for custom user projects
  const rooms = project.rooms || [];
  return (
    <svg viewBox="0 0 240 150" className="w-full h-full">
      <rect x="20" y="20" width="200" height="110" fill="none" stroke="#10b981" strokeWidth="1.5" rx="3" />
      {rooms.length > 0 ? (
        rooms.slice(0, 4).map((r, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = 25 + col * 95;
          const y = 25 + row * 50;
          return (
            <g key={r.id || i}>
              <rect x={x} y={y} width="90" height="45" fill="#10b981" fillOpacity={0.06 + i * 0.03} stroke="#10b981" strokeWidth="1.2" rx="2" />
              <text x={x + 45} y={y + 26} fill="#047857" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                {r.name.toUpperCase().substring(0, 16)}
              </text>
            </g>
          );
        })
      ) : (
        <g>
          <line x1="120" y1="20" x2="120" y2="130" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="20" y1="75" x2="220" y2="75" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="70" y="50" fill="#047857" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">LIVING</text>
          <text x="170" y="50" fill="#047857" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">KITCHEN</text>
          <text x="70" y="105" fill="#047857" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">BEDROOM</text>
          <text x="170" y="105" fill="#047857" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">PATIO</text>
        </g>
      )}
    </svg>
  );
};

export const MyProjectsView: React.FC<MyProjectsViewProps> = ({
  onOpenEditor,
  onOpenNewProjectModal,
  onOpenShareModal,
  onBackToDashboard,
}) => {
  const { projects, deleteProject, duplicateProject } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [cardDisplayModes, setCardDisplayModes] = useState<Record<string, 'blueprint' | 'render'>>({});

  const toggleDisplayMode = (projectId: string) => {
    setCardDisplayModes(prev => ({
      ...prev,
      [projectId]: prev[projectId] === 'render' ? 'blueprint' : 'render'
    }));
  };

  const categories = [
    { id: 'all', label: `All Plans (${projects.length})` },
    { id: 'villa', label: 'Villas & Luxury' },
    { id: 'traditional', label: 'Kerala & Traditional' },
    { id: 'duplex', label: 'Duplex & Multi-Level' },
    { id: 'bungalow', label: 'Single-Floor Bungalow' },
    { id: 'compact', label: 'Compact & Eco Tiny' },
    { id: 'farmhouse', label: 'Country Farmhouse' },
    { id: 'mediterranean', label: 'Mediterranean Villa' },
    { id: 'loft', label: 'Industrial Lofts' },
  ];

  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) ||
      (p.houseType && p.houseType.toLowerCase().includes(q)) ||
      (p.buildingDetails?.style && p.buildingDetails.style.toLowerCase().includes(q));
    
    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    
    const nameLow = p.name.toLowerCase();
    const typeLow = (p.houseType || '').toLowerCase();

    if (filterType === 'villa') return nameLow.includes('villa') || typeLow.includes('villa');
    if (filterType === 'traditional') return nameLow.includes('traditional') || nameLow.includes('kerala') || nameLow.includes('nalukettu') || typeLow.includes('traditional') || typeLow.includes('courtyard');
    if (filterType === 'duplex') return nameLow.includes('duplex') || typeLow.includes('duplex');
    if (filterType === 'bungalow') return nameLow.includes('bungalow') || nameLow.includes('scandinavian') || typeLow.includes('bungalow');
    if (filterType === 'compact') return nameLow.includes('compact') || nameLow.includes('micro') || typeLow.includes('compact') || (p.plotWidth * p.plotLength <= 1000);
    if (filterType === 'farmhouse') return nameLow.includes('farmhouse') || typeLow.includes('farmhouse');
    if (filterType === 'mediterranean') return nameLow.includes('mediterranean') || typeLow.includes('mediterranean');
    if (filterType === 'loft') return nameLow.includes('loft') || nameLow.includes('industrial') || typeLow.includes('loft');
    return true;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 text-slate-900 p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-100 bg-white p-6 rounded-3xl shadow-xs border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderGit2 className="text-emerald-600" size={24} />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Architectural Plans Gallery</h1>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold rounded-full">
              {projects.length} Distinct Plans
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Explore diverse architectural typologies: Modern Villas, Traditional Nalukettu, Duplexes, Nordic Bungalows, Farmhouses, and Lofts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          )}
          <button
            onClick={onOpenNewProjectModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition group cursor-pointer text-xs"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
            <span>Create Custom Plan</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search plans by style, room type, villa, duplex, kerala..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition shadow-xs font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filterType === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredProjects.map(project => {
          const areaSqFt = project.buildingDetails?.targetSqFt || (project.plotWidth * project.plotLength);
          const bedroomsCount = project.buildingDetails?.bedrooms ?? (project.rooms?.filter(r => r.type.toLowerCase().includes('bed')).length || 3);
          const bathroomsCount = project.buildingDetails?.bathrooms ?? (project.rooms?.filter(r => r.type.toLowerCase().includes('bath')).length || 2);
          const floors = Array.isArray(project.floors) ? project.floors.length : (typeof project.floors === 'number' ? project.floors : (project.floorsCount || 1));
          const isRenderMode = cardDisplayModes[project.id] === 'render';

          const unitLabel = project.unit === 'meters' ? 'm' : 'ft';

          return (
            <div
              key={project.id}
              className="bg-white border border-slate-200 hover:border-emerald-500 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
            >
              {/* Card Header & Preview Canvas */}
              <div className="relative h-48 bg-slate-950/5 p-3 flex flex-col justify-between overflow-hidden border-b border-slate-100">
                
                {/* Visualizer: Toggle between Distinct 2D Blueprint Wireframe and 3D Exterior Render */}
                {isRenderMode && project.thumbnail ? (
                  <div className="absolute inset-0">
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-slate-50 flex items-center justify-center p-2">
                    {/* CAD Grid Backdrop */}
                    <div 
                      className="absolute inset-0 opacity-25 pointer-events-none"
                      style={{
                        backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
                        backgroundSize: '16px 16px'
                      }}
                    />
                    <div className="relative z-10 w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <DistinctBlueprintThumbnail project={project} />
                    </div>
                  </div>
                )}

                {/* Top Badges & View Mode Switch */}
                <div className="relative z-20 flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md border border-slate-200 text-[10px] font-black text-slate-800 rounded-lg shadow-xs">
                    {project.houseType || 'Architecture'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Render / CAD View button */}
                    {project.thumbnail && (
                      <button
                        onClick={() => toggleDisplayMode(project.id)}
                        className="px-2 py-1 rounded-lg bg-white/95 hover:bg-white text-slate-700 text-[10px] font-bold border border-slate-200 shadow-xs transition cursor-pointer flex items-center gap-1"
                        title="Switch between 2D Blueprint and 3D Render view"
                      >
                        {isRenderMode ? <Compass size={11} className="text-emerald-600" /> : <Eye size={11} className="text-teal-600" />}
                        <span>{isRenderMode ? 'Blueprint' : 'Render'}</span>
                      </button>
                    )}

                    {/* Context menu */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                        className="p-1.5 rounded-lg bg-white/95 hover:bg-slate-100 text-slate-600 transition border border-slate-200 shadow-xs"
                      >
                        <MoreVertical size={13} />
                      </button>

                      {activeMenuId === project.id && (
                        <div className="absolute right-0 mt-1 w-38 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-30 text-xs">
                          <button
                            onClick={() => {
                              duplicateProject(project.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                          >
                            <Copy size={13} />
                            <span>Duplicate Plan</span>
                          </button>
                          <button
                            onClick={() => {
                              onOpenShareModal(project.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                          >
                            <Share2 size={13} />
                            <span>Share Drawing</span>
                          </button>
                          <button
                            onClick={() => {
                              deleteProject(project.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 cursor-pointer font-medium"
                          >
                            <Trash2 size={13} />
                            <span>Delete Plan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Dimension Indicator */}
                <div className="relative z-20 flex items-center justify-between text-[10px] font-mono text-slate-800 bg-white/95 backdrop-blur px-2.5 py-1 rounded-md border border-slate-200 shadow-xs w-fit">
                  <span className="text-emerald-700 font-bold">{project.plotWidth}{unitLabel} × {project.plotLength}{unitLabel}</span>
                  <span className="mx-1.5 text-slate-300">|</span>
                  <span className="font-bold">{areaSqFt.toLocaleString()} sq.{unitLabel}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      {floors} {floors > 1 ? 'Floors' : 'Floor'}
                    </span>
                    {project.buildingDetails?.style && (
                      <span className="text-[10px] text-slate-400 font-medium truncate">
                        • {project.buildingDetails.style}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onOpenEditor(project.id, '2D')}
                    className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition cursor-pointer line-clamp-1"
                    title={project.name}
                  >
                    {project.name}
                  </h3>

                  <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-2 flex-wrap">
                    <span className="font-semibold text-slate-700">{bedroomsCount} {bedroomsCount === 1 ? 'Bed' : 'Beds'}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">{bathroomsCount} {bathroomsCount === 1 ? 'Bath' : 'Baths'}</span>
                    <span>•</span>
                    <span className="text-slate-500">{project.rooms?.length || 4} Rooms</span>
                  </div>
                </div>

                {/* Action Buttons: 2D Blueprint & 3D Walkthrough */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenEditor(project.id, '2D')}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition cursor-pointer shadow-2xs"
                  >
                    <Compass size={14} />
                    <span>2D Blueprint</span>
                  </button>

                  <button
                    onClick={() => onOpenEditor(project.id, '3D')}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <Box size={14} />
                    <span>View 3D</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* "+ Create Custom Floor Plan" Card */}
        <button
          onClick={onOpenNewProjectModal}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 rounded-3xl min-h-[310px] flex flex-col items-center justify-center p-6 text-center group transition-all duration-300 cursor-pointer shadow-xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition mb-3 shadow-sm border border-emerald-200">
            <Plus size={26} />
          </div>
          <span className="text-base font-black text-slate-900 group-hover:text-emerald-800">
            Create Custom Floor Plan
          </span>
          <span className="text-xs text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
            Draft a personalized floor plan with custom plot dimensions, rooms, and multi-floor CAD layout.
          </span>
        </button>
      </div>
    </div>
  );
};

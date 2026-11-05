import React, { useState } from 'react';
import { useProject } from '../../../context/ProjectContext';
import { Plus, Layers, Edit2, Trash2, Check, X } from 'lucide-react';

interface Floor {
  id: string;
  name: string;
  index: number;
}

interface EditorFloorsPanelProps {
  className?: string;
}

export const EditorFloorsPanel: React.FC<EditorFloorsPanelProps> = ({ className = '' }) => {
  const { currentProject } = useProject();
  const [activeFloor, setActiveFloor] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!currentProject) return null;

  // Build floors from floorsCount
  const floorsCount = currentProject.floorsCount || 1;
  const floors: Floor[] = Array.from({ length: floorsCount }, (_, i) => ({
    id: `floor-${i}`,
    name: i === 0 ? 'Ground Floor' : i === 1 ? 'First Floor' : i === 2 ? 'Second Floor' : `Floor ${i}`,
    index: i
  }));

  return (
    <div className={`flex items-center gap-1 px-3 py-1.5 bg-white border-t border-slate-200 ${className}`}>
      <Layers size={13} className="text-emerald-600 shrink-0" />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Floors:</span>

      <div className="flex items-center gap-1 overflow-x-auto">
        {floors.map(floor => (
          <button
            key={floor.id}
            onClick={() => setActiveFloor(floor.index)}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
              activeFloor === floor.index
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            {floor.name}
          </button>
        ))}
      </div>

      <button
        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer ml-1 shrink-0"
        title="Add Floor"
      >
        <Plus size={13} />
      </button>
    </div>
  );
};

import React from 'react';
import { useProject } from '../../../context/ProjectContext';
import { ToolMode } from '../../../types/floorplan';
import {
  Square,
  DoorOpen,
  AppWindow
} from 'lucide-react';

interface BuildTool {
  id: ToolMode;
  icon: React.ElementType;
  name: string;
  description: string;
  color: string;
}

const BUILD_TOOLS: BuildTool[] = [
  {
    id: 'wall',
    icon: Square,
    name: 'Draw Wall',
    description: 'Create walls by clicking points on the canvas',
    color: '#0f172a'
  },
  {
    id: 'door',
    icon: DoorOpen,
    name: 'Add Door',
    description: 'Place a door opening on any wall',
    color: '#b45309'
  },
  {
    id: 'window',
    icon: AppWindow,
    name: 'Add Window',
    description: 'Place a window on any wall segment',
    color: '#0284c7'
  }
];

export const EditorBuildPanel: React.FC = () => {
  const { toolMode, setToolMode } = useProject();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Build Tools</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">Select a tool then draw on the canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {BUILD_TOOLS.map(tool => {
          const Icon = tool.icon;
          const isActive = toolMode === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setToolMode(tool.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold ${isActive ? 'text-emerald-800' : 'text-slate-800'}`}>
                  {tool.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  {tool.description}
                </div>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tool Tip */}
      <div className="p-3 border-t border-slate-100">
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] text-emerald-800 leading-relaxed">
          {toolMode === 'wall' && '→ Click to start a wall, click again to finish. Press Escape to cancel.'}
          {toolMode === 'door' && '→ Hover over a wall to snap the door. Click to place it.'}
          {toolMode === 'window' && '→ Hover over a wall to snap the window. Click to place it.'}
          {!['wall', 'door', 'window'].includes(toolMode) && '→ Select a tool above to begin.'}
        </div>
      </div>
    </div>
  );
};

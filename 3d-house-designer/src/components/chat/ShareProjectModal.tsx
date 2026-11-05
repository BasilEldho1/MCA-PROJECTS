import React, { useState } from 'react';
import { Project } from '../../types/floorplan';
import { useProject } from '../../context/ProjectContext';
import { useChat } from '../../context/ChatContext';
import { X, Share2, Box, Send, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({ isOpen, onClose }) => {
  const { projects } = useProject();
  const { shareProject } = useChat();

  const [selectedId, setSelectedId] = useState<string>(projects[0]?.id || '');
  const [note, setNote] = useState<string>(
    'Please review this floor plan layout. I would appreciate your advice on structural walls and room flow.'
  );
  const [isSharing, setIsSharing] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedProject = projects.find(p => p.id === selectedId);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setIsSharing(true);
    try {
      await shareProject(selectedProject, note);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.3 } });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white border border-emerald-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl">
              <Share2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Share 3D Floor Plan in Chat</h2>
              <p className="text-slate-500 text-[11px]">Send an interactive CAD blueprint to this consultation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleShare} className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-slate-700 font-bold block mb-1.5">
              Select Architectural Project
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {projects.map(p => {
                const isSelected = p.id === selectedId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="h-16 rounded-xl overflow-hidden relative bg-white border border-slate-200 flex items-center justify-center p-2">
                      <div 
                        className="absolute inset-0 opacity-15 pointer-events-none"
                        style={{
                          backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
                          backgroundSize: '12px 12px'
                        }}
                      />
                      <Box size={22} className={isSelected ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                        {p.houseType}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs line-clamp-1 text-slate-900">{p.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {p.plotWidth}×{p.plotLength} {p.unit} • {p.rooms.length} Rooms
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1.5">
              Consultation Question / Review Note
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Can you suggest a better living room and kitchen entrance layout?"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white resize-none leading-relaxed transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSharing || !selectedProject}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Send size={14} />
              <span>{isSharing ? 'Sharing...' : 'Send Blueprint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

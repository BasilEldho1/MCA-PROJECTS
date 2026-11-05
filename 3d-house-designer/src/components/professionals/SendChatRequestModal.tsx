import React, { useState } from 'react';
import { Professional, Project, ProjectSnapshot } from '../../types/floorplan';
import { useProject } from '../../context/ProjectContext';
import { useChat } from '../../context/ChatContext';
import { X, MessageSquare, Send, Check, Box, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SendChatRequestModalProps {
  professional: Professional | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendChatRequestModal: React.FC<SendChatRequestModalProps> = ({
  professional,
  onClose,
  onSuccess
}) => {
  const { projects } = useProject();
  const { sendChatRequest } = useChat();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [message, setMessage] = useState<string>(
    'Hello! I am designing my house floor plan and would appreciate your professional advice on room flow and structural layout.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!professional) return null;

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    let snapshot: ProjectSnapshot | null = null;
    if (selectedProject) {
      snapshot = {
        id: selectedProject.id,
        name: selectedProject.name,
        houseType: selectedProject.houseType,
        plotWidth: selectedProject.plotWidth,
        plotLength: selectedProject.plotLength,
        unit: selectedProject.unit,
        floorsCount: selectedProject.floorsCount,
        thumbnail: selectedProject.thumbnail,
        roomsCount: selectedProject.rooms.length,
        walls: selectedProject.walls,
        rooms: selectedProject.rooms,
        doors: selectedProject.doors,
        windows: selectedProject.windows,
        furniture: selectedProject.furniture
      };
    }

    const receiverUserId =
      typeof professional.userId === 'object'
        ? (professional.userId as any)._id || (professional.userId as any).id
        : professional.userId || (professional as any)._id || (professional as any).id;

    const result = await sendChatRequest(
      receiverUserId,
      message,
      selectedProjectId || null,
      snapshot
    );

    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(result.message || 'Chat request sent successfully!');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setErrorMsg(result.message || 'Failed to send request. A pending request may already exist.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white border border-emerald-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Consultation Chat Request</h2>
              <p className="text-slate-500 text-[11px]">Request direct conversation with {professional.name}</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target Professional Card */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <img
              src={professional.profileImage}
              alt={professional.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-xs">{professional.name}</h3>
              <p className="text-emerald-700 text-[11px] font-semibold">{professional.specialization}</p>
              <p className="text-slate-500 text-[10px]">{professional.experience} • {professional.hourlyRate}</p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs">
              <Check size={16} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Project Attachment Dropdown */}
          <div>
            <label className="text-slate-700 font-bold block mb-1.5 flex items-center justify-between">
              <span>Attach Floor Plan Project (Optional)</span>
              <span className="text-slate-400 font-normal text-[10px]">Discuss this design in 3D</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            >
              <option value="">-- No specific project (General Consultation) --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  🏠 {p.name} ({p.houseType} • {p.plotWidth}×{p.plotLength} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Attached Project Mini Card Preview */}
          {selectedProject && (
            <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <img
                src={selectedProject.thumbnail || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80'}
                alt={selectedProject.name}
                className="w-14 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div className="flex-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">{selectedProject.houseType}</span>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{selectedProject.name}</h4>
                <p className="text-[10px] text-slate-500">
                  {selectedProject.rooms.length} Rooms • {selectedProject.walls.length} Walls
                </p>
              </div>
            </div>
          )}

          {/* Message Textarea */}
          <div>
            <label className="text-slate-700 font-bold block mb-1.5">
              Consultation Inquiry / Note
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Explain what aspects of your floor plan you need guidance on..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white resize-none leading-relaxed transition"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!successMsg}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Send size={14} />
              <span>{isSubmitting ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

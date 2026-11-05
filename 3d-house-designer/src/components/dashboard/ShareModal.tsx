import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, projectId }) => {
  const [copied, setCopied] = useState(false);
  const [allowCopy, setAllowCopy] = useState(true);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/?project=${projectId || 'modern-villa'}`;
  const embedCode = `<iframe src="${shareUrl}" width="800" height="600" frameborder="0"></iframe>`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.3 } });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-200">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080d19]">
          <div className="flex items-center gap-2">
            <Share2 className="text-cyan-400" size={18} />
            <h2 className="text-sm font-bold text-white">Share Floor Plan Project</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Public Web Blueprint Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-[#080d19] border border-slate-800 rounded-xl p-2.5 text-cyan-300 font-mono text-[11px]"
              />
              <button
                onClick={() => handleCopy(shareUrl)}
                className="flex items-center gap-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Embed CAD Viewer iFrame</label>
            <textarea
              readOnly
              rows={2}
              value={embedCode}
              className="w-full bg-[#080d19] border border-slate-800 rounded-xl p-2 text-slate-400 font-mono text-[10px] resize-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5 font-medium">
              <Globe size={14} className="text-cyan-400" />
              Public Interactive 3D Preview
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allowCopy}
                onChange={e => setAllowCopy(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ValidationIssue } from '../../../types/floorplan';
import { AlertTriangle, Wrench, CheckCircle2, X } from 'lucide-react';

interface ValidationPanelProps {
  issues: ValidationIssue[];
  isOpen: boolean;
  onClose: () => void;
  onAutoFix: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  issues,
  isOpen,
  onClose,
  onAutoFix
}) => {
  if (!isOpen || issues.length === 0) return null;

  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const errorCount = issues.filter(i => i.severity === 'error').length;

  return (
    <div className="absolute bottom-16 right-4 z-30 w-80 bg-white border border-amber-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 text-xs">
      <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-amber-900 font-bold">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600" />
          <span>2D Model Validation ({issues.length})</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>

      <div className="p-3 max-h-48 overflow-y-auto space-y-2">
        {issues.map(issue => (
          <div
            key={issue.id}
            className={`p-2 rounded-xl border flex items-start gap-2 ${
              issue.severity === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-amber-50/60 border-amber-200 text-amber-900'
            }`}
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div className="flex-1 text-[11px]">
              <p className="font-semibold">{issue.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-slate-600 hover:bg-slate-200/60 font-semibold rounded-lg text-[11px]"
        >
          Edit Manually
        </button>
        <button
          onClick={onAutoFix}
          className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 text-[11px]"
        >
          <Wrench size={13} />
          <span>Fix Automatically</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { WorkflowStep } from '../../../types/floorplan';
import { Upload, Cpu, Layers, Box, Sofa, ChevronRight } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: WorkflowStep;
  onSelectStep: (step: WorkflowStep) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onSelectStep }) => {
  const steps: { id: WorkflowStep; label: string; number: number; icon: React.ReactNode }[] = [
    { id: 'upload', label: '1 Upload', number: 1, icon: <Upload size={13} /> },
    { id: 'analyze', label: '2 Analyze', number: 2, icon: <Cpu size={13} /> },
    { id: 'edit2d', label: '3 Edit 2D', number: 3, icon: <Layers size={13} /> },
    { id: 'generate3d', label: '4 Generate 3D', number: 4, icon: <Box size={13} /> },
    { id: 'interior', label: '5 Interior Design', number: 5, icon: <Sofa size={13} /> }
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold select-none overflow-x-auto">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.id;
        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => onSelectStep(step.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {step.icon}
              <span>{step.label}</span>
            </button>
            {idx < steps.length - 1 && <ChevronRight size={12} className="text-slate-400 shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

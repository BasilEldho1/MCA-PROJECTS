import React from 'react';
import { Professional } from '../../types/floorplan';
import {
  X,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  Award,
  Sparkles
} from 'lucide-react';

interface ProfessionalProfileModalProps {
  professional: Professional | null;
  onClose: () => void;
  onRequestChat: (pro: Professional) => void;
}

export const ProfessionalProfileModal: React.FC<ProfessionalProfileModalProps> = ({
  professional,
  onClose,
  onRequestChat
}) => {
  if (!professional) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white border border-emerald-100 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Hero */}
        <div className="relative p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-b border-emerald-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={professional.profileImage}
                alt={professional.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  professional.availability === 'available'
                    ? 'bg-emerald-500'
                    : professional.availability === 'busy'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
                title={`Status: ${professional.availability}`}
              />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900">{professional.name}</h2>
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                  <ShieldCheck size={12} />
                  <span>Verified Pro</span>
                </span>
              </div>

              <p className="text-sm font-semibold text-emerald-700">{professional.specialization}</p>

              <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 flex-wrap">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star size={13} fill="currentColor" />
                  <span>{professional.rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({professional.reviewsCount} reviews)</span>
                </span>
                {professional.location && (
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin size={13} className="text-emerald-600" />
                    <span>{professional.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-center">
              <Clock size={18} className="text-emerald-600 mb-1" />
              <span className="text-slate-400 text-[10px] font-medium">Experience</span>
              <span className="font-black text-slate-900">{professional.experience}</span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-center">
              <DollarSign size={18} className="text-emerald-600 mb-1" />
              <span className="text-slate-400 text-[10px] font-medium">Rate</span>
              <span className="font-black text-slate-900">{professional.hourlyRate}</span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-center">
              <Award size={18} className="text-teal-600 mb-1" />
              <span className="text-slate-400 text-[10px] font-medium">Availability</span>
              <span className="font-black text-slate-900 capitalize">{professional.availability}</span>
            </div>
          </div>

          {/* About & Bio */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Professional Bio & Approach</h3>
            <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              {professional.description ||
                'Dedicated building and architectural professional helping clients realize functional, beautiful house floor plans with 3D reviews and structural insights.'}
            </p>
          </div>

          {/* Specialization & Expertise Skills */}
          {professional.skills && professional.skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Core Expertise & Skills</h3>
              <div className="flex flex-wrap gap-2">
                {professional.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-semibold border border-emerald-200"
                  >
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chat Pricing Plans */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Consultation Pricing</span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Razorpay Verified
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(professional.chatPricing && professional.chatPricing.length > 0
                ? professional.chatPricing
                : [
                    { durationMinutes: 30, price: 199, label: '30 Minutes' },
                    { durationMinutes: 60, price: 349, label: '60 Minutes' }
                  ]
              ).map((tier, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{tier.label || `${tier.durationMinutes} Mins`}</span>
                    <span className="text-[10px] text-slate-500">Live 1-on-1 Chat</span>
                  </div>
                  <span className="text-sm font-black text-emerald-700 font-mono">₹{tier.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How Floor Plan Consultations Work */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
              <Sparkles size={14} className="text-emerald-600" />
              <span>Direct 3D Floor Plan Collaboration</span>
            </h4>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              When your paid session starts, a real-time countdown timer begins. You can exchange messages, share CAD blueprints, and inspect interactive 3D floor plans together!
            </p>
          </div>
        </div>

        {/* Action Footer */}
        {(() => {
          const isVerified =
            professional.verification?.status === 'APPROVED' ||
            professional.verificationStatus === 'verified';

          return (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  Close
                </button>

                {isVerified ? (
                  <button
                    onClick={() => onRequestChat(professional)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition cursor-pointer"
                  >
                    <MessageSquare size={15} />
                    <span>Chat with Professional (₹199 / 30m)</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-200 text-slate-500 font-bold text-xs rounded-xl cursor-not-allowed"
                  >
                    <span>Professional verification pending/rejected. Paid chat not available.</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

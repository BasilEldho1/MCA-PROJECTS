import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Professional } from '../../types/floorplan';
import { ProfessionalProfileModal } from './ProfessionalProfileModal';
import { PaymentCheckoutModal } from '../payment/PaymentCheckoutModal';
import {
  Search,
  ShieldCheck,
  Star,
  MessageSquare,
  ArrowLeft,
  Clock3,
  MapPin,
  Users
} from 'lucide-react';

interface FindProfessionalsViewProps {
  onBackToDashboard: () => void;
  onOpenChat: () => void;
}

const SPECIALIZATIONS = [
  { label: 'All Specialists', value: 'all' },
  { label: 'Architects', value: 'Architect' },
  { label: 'Interior Designers', value: 'Interior Designer' },
  { label: 'Civil Engineers', value: 'Civil Engineer' },
  { label: 'Builders & Contractors', value: 'Builder' }
];

export const FindProfessionalsView: React.FC<FindProfessionalsViewProps> = ({
  onBackToDashboard,
  onOpenChat
}) => {
  const { professionals, selectConversation } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('all');
  const [profileModalPro, setProfileModalPro] = useState<Professional | null>(null);
  const [checkoutModalPro, setCheckoutModalPro] = useState<Professional | null>(null);

  const filteredProfessionals = professionals.filter(pro => {
    const matchesSpec =
      selectedSpec === 'all' || pro.specialization.toLowerCase().includes(selectedSpec.toLowerCase());
    const matchesSearch =
      pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pro.location && pro.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pro.skills && pro.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesSpec && matchesSearch;
  });

  return (
    <div className="min-h-full flex-1 flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="h-16 bg-white border-b border-emerald-100 px-6 flex items-center justify-between shadow-xs sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Dashboard</span>
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <h1 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2">
            <span>Architects & Engineering Directory</span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Verified License
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <MessageSquare size={14} />
            <span>Consultations & Messages</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Hero Search & Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-100 bg-white p-6 rounded-2xl border shadow-xs">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="text-emerald-600" size={24} />
              <span>Hire Licensed Architects & Builders</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Collaborate directly on CAD blueprints, structural calculations, and 3D house walkthroughs.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, skill, location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SPECIALIZATIONS.map(spec => (
            <button
              key={spec.value}
              onClick={() => setSelectedSpec(spec.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedSpec === spec.value
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              {spec.label}
            </button>
          ))}
        </div>

        {/* Professionals Cards Grid */}
        {filteredProfessionals.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-between justify-center mx-auto mb-4 border border-emerald-100">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Professionals Found</h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              {searchQuery || selectedSpec !== 'all'
                ? 'No registered professionals match your current filter criteria. Try adjusting your search query or specialization category.'
                : 'There are currently no registered professionals in the directory. Verified architects and engineers will appear here once registered and approved.'}
            </p>
            {(searchQuery || selectedSpec !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpec('all');
                }}
                className="mt-4 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition cursor-pointer"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProfessionals.map(pro => {
              const isVerified =
                pro.verification?.status === 'APPROVED' || pro.verificationStatus === 'verified';
              const pricePlan = pro.chatPricing && pro.chatPricing.length > 0 ? pro.chatPricing[0] : { durationMinutes: 30, price: 199 };

              return (
                <div
                  key={pro.id}
                  className="bg-white border border-emerald-100 hover:border-emerald-400 hover:shadow-lg rounded-2xl p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between space-y-4 group"
                >
                  {/* Header info */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={pro.profileImage}
                          alt={pro.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs group-hover:border-emerald-500 transition"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            pro.availability === 'available'
                              ? 'bg-emerald-500'
                              : pro.availability === 'busy'
                              ? 'bg-amber-400'
                              : 'bg-slate-400'
                          }`}
                          title={`Availability: ${pro.availability}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3
                            onClick={() => setProfileModalPro(pro)}
                            className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 cursor-pointer transition truncate"
                          >
                            {pro.name}
                          </h3>
                        </div>

                        <p className="text-xs font-semibold text-emerald-700 truncate">{pro.specialization}</p>

                        <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-1">
                          <Star size={12} fill="currentColor" />
                          <span>{pro.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({pro.reviewsCount})</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Status Badge */}
                    <div>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full">
                          <ShieldCheck size={11} className="text-emerald-600" />
                          <span>Verified Professional ✓</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                          <Clock3 size={11} />
                          <span>Verification Pending</span>
                        </span>
                      )}
                    </div>

                    {/* Chat Price Banner */}
                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600 text-[11px] font-medium">Chat Price</span>
                      <span className="font-black text-emerald-700 font-mono">
                        ₹{pricePlan.price} / {pricePlan.durationMinutes} mins
                      </span>
                    </div>

                    {/* Location & Experience meta */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin size={12} className="text-emerald-600" />
                        <span>{pro.location || 'Kerala, India'}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-700">{pro.experience}</span>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {pro.description}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setProfileModalPro(pro)}
                        className="w-1/3 py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 transition text-center cursor-pointer"
                      >
                        Profile
                      </button>

                      {isVerified ? (
                        <button
                          onClick={() => setCheckoutModalPro(pro)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
                        >
                          <MessageSquare size={12} />
                          <span>Chat with Professional</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 py-2 px-2 bg-slate-100 text-slate-400 text-[10px] font-semibold rounded-xl border border-slate-200 cursor-not-allowed text-center leading-tight"
                        >
                          Verification pending. Paid chat unavailable.
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <ProfessionalProfileModal
        professional={profileModalPro}
        onClose={() => setProfileModalPro(null)}
        onRequestChat={pro => {
          setProfileModalPro(null);
          setCheckoutModalPro(pro);
        }}
      />

      <PaymentCheckoutModal
        isOpen={Boolean(checkoutModalPro)}
        professional={checkoutModalPro}
        onClose={() => setCheckoutModalPro(null)}
        onPaymentSuccess={(session, conversationId) => {
          setCheckoutModalPro(null);
          selectConversation(conversationId);
          onOpenChat();
        }}
      />
    </div>
  );
};

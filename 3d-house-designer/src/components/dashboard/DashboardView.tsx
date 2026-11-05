import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Professional } from '../../types/floorplan';
import { ProfessionalProfileModal } from '../professionals/ProfessionalProfileModal';
import { PaymentCheckoutModal } from '../payment/PaymentCheckoutModal';
import {
  Plus,
  Share2,
  Search,
  Box,
  Sparkles,
  ShieldCheck,
  LogOut,
  FolderOpen,
  Users,
  MessageSquare,
  Briefcase,
  Compass,
  LogIn,
  UserPlus,
  Star,
  Clock3,
  MapPin,
  ArrowRight,
  Upload
} from 'lucide-react';

interface DashboardViewProps {
  onOpenEditor: (projectId: string, view?: '2D' | '3D') => void;
  onOpenNewProjectModal: () => void;
  onOpenShareModal: (projectId?: string) => void;
  onOpenProfileModal: () => void;
  onOpenAdminModal: () => void;
  onOpenProfessionals: () => void;
  onOpenChat: () => void;
  onOpenProfessionalDashboard: () => void;
  onOpenMyProjects?: () => void;
  onOpenSettings?: () => void;
  onOpenLanding?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: (role?: 'user' | 'professional') => void;
  onOpenPaymentDemo?: () => void;
  onOpenUploadPlan?: (targetView?: '2D' | '3D') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenEditor,
  onOpenNewProjectModal,
  onOpenShareModal,
  onOpenProfileModal,
  onOpenAdminModal,
  onOpenProfessionals,
  onOpenChat,
  onOpenProfessionalDashboard,
  onOpenMyProjects,
  onOpenSettings,
  onOpenLanding,
  onOpenLogin,
  onOpenRegister,
  onOpenPaymentDemo,
  onOpenUploadPlan
}) => {
  const { projects } = useProject();
  const { user, logout, isAdmin, isProfessional } = useAuth();
  const { unreadCount, pendingRequestsCount, professionals, loadProfessionals, selectConversation } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedProForModal, setSelectedProForModal] = useState<Professional | null>(null);
  const [selectedProForCheckout, setSelectedProForCheckout] = useState<Professional | null>(null);

  useEffect(() => {
    loadProfessionals();
  }, [loadProfessionals]);

  const verifiedProsCount = professionals.filter(
    p => p.verification?.status === 'APPROVED' || p.verificationStatus === 'verified'
  ).length;
  const pendingProsCount = professionals.length - verifiedProsCount;

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
    if (filterType === 'bungalow') return nameLow.includes('bungalow') || nameLow.includes('scandinavian') || typeLow.includes('bungalow') || typeLow.includes('single floor');
    if (filterType === 'compact') return nameLow.includes('compact') || nameLow.includes('micro') || typeLow.includes('compact') || (p.plotWidth * p.plotLength <= 1000);
    if (filterType === 'farmhouse') return nameLow.includes('farmhouse') || typeLow.includes('farmhouse');
    if (filterType === 'mediterranean') return nameLow.includes('mediterranean') || typeLow.includes('mediterranean');
    if (filterType === 'loft') return nameLow.includes('loft') || nameLow.includes('industrial') || typeLow.includes('loft');
    return typeLow.includes(filterType.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="h-16 bg-white border-b border-emerald-100 px-6 flex items-center justify-between shadow-xs z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div
            onClick={onOpenLanding}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-600/20 border border-emerald-300 cursor-pointer"
          >
            <Box size={20} />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>3D House Floor Plan Designer</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                STUDIO
              </span>
            </h1>
            <p className="text-xs text-slate-500">Architectural 2D Blueprint & 3D WebGL Workstation</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Create Project Button */}
          <button
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>New Project</span>
          </button>

          {/* My Projects */}
          {onOpenMyProjects && (
            <button
              onClick={onOpenMyProjects}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl font-semibold text-xs transition cursor-pointer"
            >
              <FolderOpen size={15} className="text-emerald-600" />
              <span className="hidden sm:inline">All Plans</span>
            </button>
          )}

          {/* Find Professionals Button */}
          <button
            onClick={onOpenProfessionals}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl font-semibold text-xs transition cursor-pointer"
          >
            <Users size={15} className="text-emerald-600" />
            <span className="hidden sm:inline">Professionals</span>
          </button>

          {/* Messages Button with Unread Badge */}
          <button
            onClick={onOpenChat}
            className="relative flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl font-semibold text-xs transition cursor-pointer"
          >
            <MessageSquare size={15} className="text-emerald-600" />
            <span className="hidden sm:inline">Messages</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-black">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Professional Dashboard Workspace Button (for Pro Users) */}
          {isProfessional && (
            <button
              onClick={onOpenProfessionalDashboard}
              className="relative flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-semibold text-xs transition cursor-pointer"
            >
              <Briefcase size={15} className="text-teal-600" />
              <span className="hidden md:inline">Pro Workspace</span>
              {pendingRequestsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>
          )}

          {/* Upload Plan for 2D/3D Conversion Button */}
          <button
            onClick={() => onOpenUploadPlan && onOpenUploadPlan('3D')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs rounded-xl font-bold text-xs transition cursor-pointer"
            title="Upload floor plan blueprint or sketch for instant 2D CAD & 3D WebGL conversion"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Upload Plan (2D/3D)</span>
          </button>

          {isAdmin && (
            <button
              onClick={onOpenAdminModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs rounded-xl font-bold text-xs transition cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>Admin Console</span>
            </button>
          )}

          {/* User logged in vs Guest buttons */}
          {user ? (
            <>
              {/* Role Badge */}
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 capitalize">
                {user?.role || 'User'}
              </span>

              <button
                onClick={onOpenProfileModal}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <img
                  src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                  alt="Avatar"
                  className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200"
                />
                <span className="hidden lg:inline">{user?.name || 'Profile'}</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <>
              {/* Unauthenticated: Sign In and Create Account buttons */}
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                <LogIn size={15} className="text-emerald-600" />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => onOpenRegister && onOpenRegister('user')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <UserPlus size={15} />
                <span>Create Account</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Guest Banner if not signed in */}
        {!user && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <span className="font-bold text-slate-900">Welcome to 3D House Floor Plan Designer!</span>
                <p className="text-slate-500 text-[11px]">Sign in to save plans to the database, sync across devices, and hire architectural professionals.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenRegister && onOpenRegister('user')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Register Free
              </button>
            </div>
          </div>
        )}
        {/* 1. Welcome Section matching White and Green aesthetics */}
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white border border-emerald-200/80 p-8 sm:p-10 overflow-hidden shadow-sm">
          {/* Technical blueprint background accents */}
          <div className="absolute right-0 top-0 bottom-0 w-96 opacity-30 pointer-events-none bg-blueprint-grid" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 bg-white border border-emerald-200 px-3 py-1 rounded-full inline-block shadow-2xs">
              Architectural Studio 2026
            </span>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Welcome Back! Start designing your next{' '}
              <span className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                house project.
              </span>
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Manage your architectural drawings, toggle between 2D drafting and real-time 3D models,
              and connect with certified architects and builders.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenNewProjectModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Plus size={16} />
                <span>New House Project</span>
              </button>

              <button
                onClick={() => onOpenUploadPlan && onOpenUploadPlan('3D')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-600 font-bold text-xs rounded-xl shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Upload size={16} className="text-emerald-600" />
                <span>Upload Plan (2D &amp; 3D Conversion)</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Quick Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Total House Projects</span>
            <span className="text-2xl font-black text-slate-900 font-mono">{projects.length}</span>
            <span className="text-[10px] text-emerald-700 block mt-1 font-semibold">Active floor plans</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Total Designed Area</span>
            <span className="text-2xl font-black text-slate-900 font-mono">8,600 sq.ft</span>
            <span className="text-[10px] text-emerald-700 block mt-1 font-semibold">CAD verified</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">3D Visualizations</span>
            <span className="text-2xl font-black text-slate-900 font-mono">4 Models</span>
            <span className="text-[10px] text-teal-700 block mt-1 font-semibold">WebGL ready</span>
          </div>
          <div
            onClick={onOpenProfessionals}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs cursor-pointer transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 block mb-1">Architect Network</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition">
                Directory →
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {professionals.length > 0 ? `${professionals.length} Available` : 'Directory'}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-1 font-semibold">
              {verifiedProsCount} Verified • {pendingProsCount} New / In Review
            </span>
          </div>
        </div>

        {/* Architects & Engineering Professionals Showcase */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
                  Verified & Registered Experts
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {professionals.length} specialists available
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                <Users className="text-emerald-600" size={22} />
                <span>Architects & Design Professionals</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Connect with certified architects, structural engineers, and interior designers to review your plans.
              </p>
            </div>
            <button
              onClick={onOpenProfessionals}
              className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <span>Explore All ({professionals.length})</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Cards Grid */}
          {professionals.length === 0 ? (
            <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500">
              Loading registered professionals...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {professionals.slice(0, 4).map(pro => {
                const isVerified =
                  pro.verification?.status === 'APPROVED' || pro.verificationStatus === 'verified';
                const avatarUrl =
                  pro.profileImage ||
                  pro.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(pro.name)}`;

                return (
                  <div
                    key={pro.id || pro._id}
                    className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={avatarUrl}
                            alt={pro.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 group-hover:border-emerald-500 transition"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                              pro.availability === 'available'
                                ? 'bg-emerald-500'
                                : pro.availability === 'busy'
                                ? 'bg-amber-400'
                                : 'bg-slate-400'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            onClick={() => setSelectedProForModal(pro)}
                            className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 cursor-pointer transition truncate"
                          >
                            {pro.name}
                          </h4>
                          <p className="text-[11px] font-semibold text-emerald-700 truncate">
                            {pro.specialization || 'Architect'}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                            <Star size={11} fill="currentColor" />
                            <span>{(pro.rating || 5.0).toFixed(1)}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({pro.reviewsCount ?? 0})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                            <ShieldCheck size={11} className="text-emerald-600" />
                            <span>Verified Pro ✓</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                            <Clock3 size={11} />
                            <span>Verification Pending</span>
                          </span>
                        )}
                      </div>

                      {/* Location & Experience */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <MapPin size={10} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{pro.location || 'India'}</span>
                        </span>
                        <span className="font-semibold text-slate-700 shrink-0">
                          {pro.experience || '3+ yrs'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedProForModal(pro)}
                        className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition text-center cursor-pointer"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          if (isVerified) {
                            setSelectedProForCheckout(pro);
                          } else {
                            onOpenProfessionals();
                          }
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer flex items-center justify-center gap-1 ${
                          isVerified
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <MessageSquare size={11} />
                        <span>{isVerified ? 'Consult' : 'Details'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search house plans by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
            {[
              { id: 'all', label: 'All Plans' },
              { id: 'villa', label: 'Villas' },
              { id: 'traditional', label: 'Traditional' },
              { id: 'duplex', label: 'Duplex' },
              { id: 'bungalow', label: 'Bungalow' },
              { id: 'compact', label: 'Compact' },
              { id: 'farmhouse', label: 'Farmhouse' },
              { id: 'mediterranean', label: 'Mediterranean' },
              { id: 'loft', label: 'Lofts' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterType(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl capitalize transition cursor-pointer whitespace-nowrap ${filterType === cat.id
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* "+ Create New Project" Card matching prompt */}
          <div
            onClick={onOpenNewProjectModal}
            className="group border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition transform hover:-translate-y-1 min-h-[300px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center mb-4 transition shadow-md border border-emerald-200">
              <Plus size={28} />
            </div>
            <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition">
              + Create New Project
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Start drafting a new architectural floor plan with custom house type, floor count, and area.
            </p>
          </div>

          {/* Upload Plan for 2D/3D Conversion Card */}
          <div
            onClick={() => onOpenUploadPlan && onOpenUploadPlan('3D')}
            className="group border-2 border-dashed border-teal-300 hover:border-emerald-500 bg-gradient-to-br from-teal-50/40 via-emerald-50/20 to-white hover:bg-emerald-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition transform hover:-translate-y-1 min-h-[300px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center mb-4 transition shadow-md group-hover:scale-105">
              <Upload size={26} />
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition">
                Upload Floor Plan
              </h3>
              <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md border border-emerald-200">
                2D / 3D
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Upload blueprint image, sketch, or PDF to automatically convert into editable 2D vector plans and real-time 3D buildings.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/60 group-hover:bg-emerald-600 group-hover:text-white px-3.5 py-1.5 rounded-xl transition">
              <span>Convert Plan Now</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Project List Cards matching user prompt specifications */}
          {filteredProjects.map(project => {
            const floors = project.buildingDetails?.floors ?? project.floorsCount ?? (typeof project.floors === 'number' ? project.floors : 1);
            const bedrooms = project.buildingDetails?.bedrooms ?? (project.rooms?.filter(r => r.type.toLowerCase().includes('bed')).length || 3);
            const bathrooms = project.buildingDetails?.bathrooms ?? (project.rooms?.filter(r => r.type.toLowerCase().includes('bath')).length || 2);
            const approxSqFt = project.buildingDetails?.targetSqFt || (project.plotWidth * project.plotLength);
            const unitLabel = project.unit === 'meters' ? 'm' : 'ft';

            const createdDateFormatted = new Date(project.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div
                key={project.id}
                className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col group"
              >
                {/* Image Banner */}
                <div
                  className="relative h-44 bg-slate-50 overflow-hidden cursor-pointer border-b border-slate-100"
                  onClick={() => onOpenEditor(project.id, '2D')}
                >
                  <img
                    src={
                      project.thumbnail ||
                      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-md bg-white/95 backdrop-blur text-emerald-800 text-[10px] font-bold shadow-xs border border-slate-200">
                      {project.houseType}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-white/90 backdrop-blur text-slate-800 text-[10px] font-mono font-bold">
                      {floors} {floors > 1 ? 'Floors' : 'Floor'}
                    </span>
                  </div>

                  {/* Bottom Stats Overlay on Image */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-mono font-bold text-xs bg-slate-950/70 px-2 py-0.5 rounded backdrop-blur">
                      {approxSqFt.toLocaleString()} sq.{unitLabel}
                    </span>
                    <span className="text-[10px] text-slate-200 bg-slate-950/70 px-2 py-0.5 rounded backdrop-blur">
                      Updated: {createdDateFormatted}
                    </span>
                  </div>
                </div>

                {/* Card Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3
                      onClick={() => onOpenEditor(project.id, '2D')}
                      className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition cursor-pointer truncate"
                    >
                      {project.name}
                    </h3>

                    {/* Room Breakdown Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                      <div className="bg-slate-50 p-1.5 rounded-lg text-center">
                        <span className="text-slate-400 block text-[10px]">Bedrooms</span>
                        <span className="font-bold text-slate-800">{bedrooms} {bedrooms === 1 ? 'Bed' : 'Beds'}</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg text-center">
                        <span className="text-slate-400 block text-[10px]">Bathrooms</span>
                        <span className="font-bold text-slate-800">{bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg text-center">
                        <span className="text-slate-400 block text-[10px]">Plot</span>
                        <span className="font-mono font-bold text-slate-800">
                          {project.plotWidth}×{project.plotLength}{unitLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions matching user prompt specifications: Open Project & View 3D */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => onOpenEditor(project.id, '2D')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition cursor-pointer"
                    >
                      <Compass size={14} />
                      <span>Open Project</span>
                    </button>

                    <button
                      onClick={() => onOpenEditor(project.id, '3D')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
                    >
                      <Box size={14} />
                      <span>View 3D</span>
                    </button>

                    <button
                      onClick={() => onOpenShareModal(project.id)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-emerald-700 rounded-xl border border-slate-200 transition cursor-pointer"
                      title="Share Floor Plan"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modals for Direct Interaction from Dashboard */}
      <ProfessionalProfileModal
        professional={selectedProForModal}
        onClose={() => setSelectedProForModal(null)}
        onRequestChat={pro => {
          setSelectedProForModal(null);
          setSelectedProForCheckout(pro);
        }}
      />

      <PaymentCheckoutModal
        isOpen={Boolean(selectedProForCheckout)}
        professional={selectedProForCheckout}
        onClose={() => setSelectedProForCheckout(null)}
        onPaymentSuccess={(_session, conversationId) => {
          setSelectedProForCheckout(null);
          selectConversation(conversationId);
          onOpenChat();
        }}
      />
    </div>
  );
};

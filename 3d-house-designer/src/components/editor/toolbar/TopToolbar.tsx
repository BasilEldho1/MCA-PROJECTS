import React, { useState, useEffect } from 'react';
import { useProject } from '../../../context/ProjectContext';
import { useAuth } from '../../../context/AuthContext';
import {
  Save,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Grid3X3,
  Eye,
  Box,
  Sun,
  Moon,
  Maximize,
  Minimize,
  Download,
  Share2,
  Layers,
  ArrowLeft,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useChat } from '../../../context/ChatContext';
import { ExportModal } from '../../export/ExportModal';
import { PlanUploaderModal } from '../../upload/PlanUploaderModal';
import { Upload, FileText, Image, ChevronDown } from 'lucide-react';

interface TopToolbarProps {
  onBackToDashboard: () => void;
  onOpenNewProjectModal: () => void;
  onOpenShareModal: () => void;
  onOpenProfileModal: () => void;
  onOpenAdminModal: () => void;
  onOpenChat?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: (role?: 'user' | 'professional') => void;
}

type SaveStatus = 'saved' | 'saving' | 'unsaved';

export const TopToolbar: React.FC<TopToolbarProps> = ({
  onBackToDashboard,
  onOpenNewProjectModal,
  onOpenShareModal,
  onOpenProfileModal,
  onOpenAdminModal,
  onOpenChat,
  onOpenLogin,
  onOpenRegister
}) => {
  const {
    currentProject,
    activeView,
    setActiveView,
    cameraMode,
    setCameraMode,
    lightingMode,
    setLightingMode,
    showGrid,
    setShowGrid,
    snapGrid,
    setSnapGrid,
    showCeiling,
    setShowCeiling,
    sharedReviewInfo,
    clearReviewMode,
    canUndo,
    canRedo,
    undo,
    redo,
    deleteSelected,
    duplicateSelected,
    saveCurrentProject,
    saveStatus,
    toggleUnit
  } = useProject();

  const { user, isAdmin, logout } = useAuth();
  const { unreadCount } = useChat();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportModalTab, setExportModalTab] = useState<'png' | 'pdf' | 'save' | 'share'>('save');
  const [isPlanUploaderOpen, setIsPlanUploaderOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const handleQuickSave = async () => {
    const ok = await saveCurrentProject();
    if (ok) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.1 } });
    }
  };

  const openExportWithTab = (tab: 'png' | 'pdf' | 'save' | 'share') => {
    setExportModalTab(tab);
    setIsExportModalOpen(true);
    setIsExportDropdownOpen(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };



  const SaveStatusIndicator = () => {
    if (saveStatus === 'saving') {
      return (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Loader2 size={12} className="animate-spin text-emerald-600" />
          <span>Saving...</span>
        </div>
      );
    }
    if (saveStatus === 'saved') {
      return (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
          <CheckCircle2 size={12} />
          <span>Saved</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
        <AlertCircle size={12} />
        <span>Unsaved changes</span>
      </div>
    );
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 flex items-center justify-between text-slate-800 select-none z-30 shrink-0 gap-2">

      {/* ── LEFT SECTION: Back + Logo + Project name ── */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200 hover:border-emerald-200 rounded-lg transition cursor-pointer shrink-0"
          title="Back to Dashboard"
        >
          <ArrowLeft size={14} />
          <span className="hidden md:inline">Dashboard</span>
        </button>

        <div className="h-5 w-px bg-slate-200 shrink-0" />

        {/* Project name & type */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-[160px]">
              {currentProject?.name || '3D House Planner'}
            </h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded shrink-0">
              {currentProject?.houseType || 'Plan'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-slate-400 font-mono hidden lg:block">
              {currentProject?.plotWidth}×{currentProject?.plotLength} {currentProject?.unit} ({((currentProject?.plotWidth || 0) * (currentProject?.plotLength || 0)).toLocaleString()} sq.{currentProject?.unit === 'feet' ? 'ft' : 'm'}) · {currentProject?.rooms.length} rooms
            </p>
            <SaveStatusIndicator />
          </div>
        </div>

        {sharedReviewInfo?.isReviewing && (
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-800 shrink-0">
            <span className="font-semibold">Reviewing Shared Plan</span>
            {onOpenChat && (
              <button
                onClick={() => { clearReviewMode(); onOpenChat(); }}
                className="text-emerald-700 font-bold hover:underline ml-1 cursor-pointer"
              >
                ← Chat
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── CENTER SECTION: Main action toolbar ── */}
      <div className="flex items-center gap-1 bg-slate-100/80 px-1.5 py-1 border border-slate-200 rounded-xl shrink-0">
        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-25 hover:bg-white rounded-lg transition cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-25 hover:bg-white rounded-lg transition cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={14} />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-0.5" />

        {/* Duplicate & Delete */}
        <button
          onClick={duplicateSelected}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition cursor-pointer"
          title="Duplicate Selected"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={deleteSelected}
          className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
          title="Delete Selected"
        >
          <Trash2 size={14} />
        </button>



        <div className="h-4 w-px bg-slate-300 mx-0.5" />

        {/* 2D / 3D Toggle */}
        <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 items-center">
          <button
            onClick={() => setActiveView('2D')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
              activeView === '2D' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye size={12} />
            <span>2D</span>
          </button>
          <button
            onClick={() => setActiveView('3D')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
              activeView === '3D' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box size={12} />
            <span>3D</span>
          </button>
        </div>

        {/* 3D Camera Modes */}
        {activeView === '3D' && (
          <div className="flex items-center gap-0.5 ml-1">
            {(['perspective', 'top', 'side', 'isometric', 'firstPerson', 'orbit360'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setCameraMode(mode)}
                className={`px-2 py-1 text-[10px] font-semibold rounded transition cursor-pointer ${
                  cameraMode === mode ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
                title={mode === 'firstPerson' ? 'Interior Walkthrough' : mode}
              >
                {mode === 'perspective'
                  ? '3D'
                  : mode === 'top'
                  ? 'Top'
                  : mode === 'side'
                  ? 'Side'
                  : mode === 'isometric'
                  ? 'Iso'
                  : mode === 'firstPerson'
                  ? 'Walk'
                  : '360°'}
              </button>
            ))}
          </div>
        )}

        {/* Ceiling (3D only) */}
        {activeView === '3D' && (
          <>
            <div className="h-4 w-px bg-slate-300 mx-0.5" />
            <button
              onClick={() => setShowCeiling(!showCeiling)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${showCeiling ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-white'}`}
              title="Toggle Ceiling"
            >
              <Layers size={14} />
            </button>
          </>
        )}
      </div>

      {/* ── RIGHT SECTION: Save, Share, Export, Chat, User ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Unit toggle */}
        <button
          onClick={toggleUnit}
          className="px-2 py-1 text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-emerald-800 rounded-lg border border-slate-200 transition cursor-pointer"
          title="Switch Feet / Meters"
        >
          {currentProject?.unit?.toUpperCase() || 'FT'}
        </button>

        {/* Upload 2D Plan Button */}
        <button
          onClick={() => setIsPlanUploaderOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
          title="Upload 2D Plan (PDF / Image) and Generate 3D Model"
        >
          <Upload size={13} className="text-emerald-600" />
          <span>Upload 2D Plan</span>
        </button>

        {/* Quick Save Project */}
        <button
          onClick={handleQuickSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer"
          title="Save Project (Ctrl+S)"
        >
          <Save size={13} />
          <span>Save</span>
        </button>

        {/* Save / Export Dialog Trigger */}
        <div className="relative">
          <button
            onClick={() => openExportWithTab('save')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition cursor-pointer"
            title="Save / Export Floor Plan & 3D Model"
          >
            <Download size={13} className="text-emerald-700" />
            <span className="hidden sm:inline">Save / Export</span>
          </button>
        </div>

        {/* Share with Professional */}
        <button
          onClick={() => openExportWithTab('share')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
          title="Share Floor Plan with Approved Professionals"
        >
          <Share2 size={13} className="text-slate-600" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Chat */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="relative flex items-center gap-1.5 p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-xl border border-slate-200 transition cursor-pointer"
            title="Messages"
          >
            <MessageSquare size={15} className="text-emerald-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-emerald-600 text-white rounded-full text-[9px] font-black">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>

        <div className="h-5 w-px bg-slate-200" />

        {/* User avatar / Sign in */}
        {user ? (
          <>
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 px-2 py-1 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition cursor-pointer"
              title="Profile"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Profile'}
                  className="w-6 h-6 rounded-full object-cover shrink-0 border border-emerald-300"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-800 hidden lg:inline max-w-[80px] truncate">{user?.name || 'Profile'}</span>
            </button>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={13} />
            </button>
          </>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={onOpenAdminModal}
            className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl transition"
            title="Admin Dashboard"
          >
            <ShieldCheck size={15} />
          </button>
        )}
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialTab={exportModalTab}
      />

      <PlanUploaderModal
        isOpen={isPlanUploaderOpen}
        onClose={() => setIsPlanUploaderOpen(false)}
        createNewProjectOnUpload={false}
        initialTargetView={activeView}
      />
    </header>
  );
};

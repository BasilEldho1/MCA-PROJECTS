import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Professional } from '../../types/floorplan';
import {
  saveFileToDevice,
  generate2DPlanPng,
  capture3DCanvasSnapshot,
  generateComprehensiveProjectPdf
} from '../../utils/fileExportUtils';
import confetti from 'canvas-confetti';
import {
  Download,
  FileText,
  Box,
  Layers,
  Share2,
  Check,
  X,
  Save,
  Copy,
  ExternalLink,
  Eye,
  Sparkles,
  HardDrive,
  Search,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileDown,
  Lock,
  ArrowRight
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'png' | 'pdf' | 'save' | 'share';
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, initialTab = 'png' }) => {
  const { currentProject, activeView, setActiveView, saveCurrentProject, saveProjectAs, renameCurrentProject, saveStatus, lastSavedTime } = useProject();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'png' | 'pdf' | 'save' | 'share'>(initialTab);

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, initialTab]);

  // Notifications state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // 1. PNG EXPORT STATE
  // ─────────────────────────────────────────────────────────────
  const [pngViewType, setPngViewType] = useState<'2d' | '3d'>('2d');
  const [pngPreviewUrl, setPngPreviewUrl] = useState<string>('');
  const [pngFilename, setPngFilename] = useState<string>('');
  const [showDimensionsOnPng, setShowDimensionsOnPng] = useState(true);
  const [showRoomLabelsOnPng, setShowRoomLabelsOnPng] = useState(true);

  // Generate PNG preview when tab or pngViewType changes
  useEffect(() => {
    if (!isOpen || !currentProject) return;

    const baseName = currentProject.name.trim().toLowerCase().replace(/\s+/g, '_');

    if (pngViewType === '2d') {
      try {
        const { dataUrl } = generate2DPlanPng(currentProject, {
          width: 1200,
          height: 900,
          showDimensions: showDimensionsOnPng,
          showRoomLabels: showRoomLabelsOnPng
        });
        setPngPreviewUrl(dataUrl);
        setPngFilename(`${baseName}_2d_floor_plan`);
      } catch (e) {
        console.warn('Could not generate 2D preview', e);
      }
    } else {
      // 3D View Snapshot
      const snap = capture3DCanvasSnapshot();
      if (snap) {
        setPngPreviewUrl(snap.dataUrl);
      } else {
        // Fallback to 2D if 3D canvas not active
        const { dataUrl } = generate2DPlanPng(currentProject, { width: 1200, height: 900 });
        setPngPreviewUrl(dataUrl);
      }
      setPngFilename(`${baseName}_3d_house_model`);
    }
  }, [isOpen, currentProject, pngViewType, showDimensionsOnPng, showRoomLabelsOnPng]);

  const handleExportPng = async () => {
    if (!currentProject) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let targetBlob: Blob;

      if (pngViewType === '2d') {
        const res = generate2DPlanPng(currentProject, {
          width: 2400,
          height: 1800,
          showDimensions: showDimensionsOnPng,
          showRoomLabels: showRoomLabelsOnPng
        });
        targetBlob = res.blob;
      } else {
        const snap = capture3DCanvasSnapshot();
        if (!snap) {
          throw new Error('3D Canvas is not currently rendered. Switch to 3D View or ensure WebGL is enabled.');
        }
        targetBlob = snap.blob;
      }

      const saveRes = await saveFileToDevice({
        blob: targetBlob,
        defaultFilename: pngFilename || (pngViewType === '2d' ? 'My_House_Floor_Plan' : 'My_House_3D_Model'),
        extension: 'png',
        mimeType: 'image/png',
        description: 'PNG Architectural Image'
      });

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.3 } });
      setSuccessMessage(`Successfully saved ${saveRes.filename} to your computer!`);
    } catch (err: any) {
      if (err.message !== 'Save cancelled by user') {
        setErrorMessage(err.message || 'Failed to export PNG');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. PDF EXPORT STATE
  // ─────────────────────────────────────────────────────────────
  const [pdfExportType, setPdfExportType] = useState<'2d' | '3d' | 'complete'>('complete');
  const [pdfPageSize, setPdfPageSize] = useState<'a4' | 'a3'>('a4');
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [pdfFilename, setPdfFilename] = useState<string>('');

  useEffect(() => {
    if (!currentProject) return;
    const baseName = currentProject.name.trim().toLowerCase().replace(/\s+/g, '_');
    if (pdfExportType === '2d') setPdfFilename(`${baseName}_2d_plan`);
    else if (pdfExportType === '3d') setPdfFilename(`${baseName}_3d_model`);
    else setPdfFilename(`${baseName}_complete_project`);
  }, [currentProject, pdfExportType]);

  const handleExportPdf = async () => {
    if (!currentProject) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // High-res captures for PDF inclusion
      const highRes2d = generate2DPlanPng(currentProject, { width: 2200, height: 1600 });
      const snap3d = capture3DCanvasSnapshot();

      const { blob, filename: suggestedName } = await generateComprehensiveProjectPdf(currentProject, {
        type: pdfExportType,
        pageSize: pdfPageSize,
        orientation: pdfOrientation,
        highRes2dDataUrl: highRes2d.dataUrl,
        highRes3dDataUrl: snap3d?.dataUrl
      });

      const saveRes = await saveFileToDevice({
        blob,
        defaultFilename: pdfFilename || suggestedName,
        extension: 'pdf',
        mimeType: 'application/pdf',
        description: 'Architectural Floor Plan PDF'
      });

      confetti({ particleCount: 45, spread: 70, origin: { y: 0.35 } });
      setSuccessMessage(`PDF document successfully saved as ${saveRes.filename}!`);
    } catch (err: any) {
      if (err.message !== 'Save cancelled by user') {
        setErrorMessage(err.message || 'Failed to export PDF');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. PROJECT SAVE / SAVE AS STATE
  // ─────────────────────────────────────────────────────────────
  const [editProjectName, setEditProjectName] = useState(currentProject?.name || '');
  const [saveAsName, setSaveAsName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setEditProjectName(currentProject.name);
      setSaveAsName(`${currentProject.name} (V2)`);
    }
  }, [currentProject]);

  const handleSaveProject = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      // If name was modified, update name
      if (editProjectName.trim() && editProjectName.trim() !== currentProject?.name) {
        await renameCurrentProject(editProjectName.trim());
      }
      const ok = await saveCurrentProject();
      if (ok) {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.3 } });
        setSuccessMessage('Project successfully saved to database & local storage!');
      } else {
        setErrorMessage('Failed to save project.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Save error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAs = async () => {
    if (!saveAsName.trim()) {
      setErrorMessage('Please specify a new project name.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const cloned = await saveProjectAs(saveAsName.trim());
      if (cloned) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
        setSuccessMessage(`Project successfully cloned and saved as "${cloned.name}"!`);
      } else {
        setErrorMessage('Failed to create new project copy.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Save As error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadJSON = async () => {
    if (!currentProject) return;
    const jsonStr = JSON.stringify(currentProject, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    try {
      const saveRes = await saveFileToDevice({
        blob,
        defaultFilename: `${currentProject.name.toLowerCase().replace(/\s+/g, '_')}_project`,
        extension: 'json',
        mimeType: 'application/json',
        description: 'Floor Plan Project Backup File'
      });
      setSuccessMessage(`Project backup successfully saved as ${saveRes.filename}!`);
    } catch (e: any) {
      if (e.message !== 'Save cancelled by user') setErrorMessage(e.message);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. SHARE WITH PROFESSIONAL STATE
  // ─────────────────────────────────────────────────────────────
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingPros, setLoadingPros] = useState(false);
  const [proSearchQuery, setProSearchQuery] = useState('');
  const [selectedProId, setSelectedProId] = useState<string>('');
  const [shareFormat, setShareFormat] = useState<'png' | 'pdf' | '3d_png' | 'complete_pdf' | 'editable'>('complete_pdf');
  const [shareMessage, setShareMessage] = useState('Hello, please review my architectural floor plan and advise on structural layout.');
  const [allowEditableAccess, setAllowEditableAccess] = useState(false);
  const [isShareConfirmStep, setIsShareConfirmStep] = useState(false);

  useEffect(() => {
    if (activeTab === 'share' && isOpen) {
      setLoadingPros(true);
      api
        .getProfessionals({ status: 'APPROVED' })
        .then(res => {
          setProfessionals(res.professionals || []);
          if (res.professionals && res.professionals.length > 0 && !selectedProId) {
            setSelectedProId(res.professionals[0]._id || (res.professionals[0] as any).id);
          }
        })
        .catch(err => {
          console.warn('Failed to load professionals:', err);
        })
        .finally(() => setLoadingPros(false));
    }
  }, [activeTab, isOpen]);

  const filteredPros = professionals.filter(p => {
    const q = proSearchQuery.toLowerCase();
    return (
      !proSearchQuery ||
      p.name.toLowerCase().includes(q) ||
      p.specialization.toLowerCase().includes(q) ||
      (p.companyName && p.companyName.toLowerCase().includes(q)) ||
      (p.skills && p.skills.some(s => s.toLowerCase().includes(q)))
    );
  });

  const selectedPro = professionals.find(p => p._id === selectedProId || (p as any).id === selectedProId);

  const handleSendToProfessional = async () => {
    if (!currentProject || !selectedProId) {
      setErrorMessage('Please select a verified professional.');
      return;
    }
    if (!user) {
      setErrorMessage('Please sign in to share projects with professionals.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Prepare attachments based on shareFormat
      const files: any[] = [];
      const highRes2d = generate2DPlanPng(currentProject, { width: 1800, height: 1200 });
      const snap3d = capture3DCanvasSnapshot();

      if (shareFormat === 'png') {
        files.push({
          name: `${currentProject.name}_2D_Plan.png`,
          type: 'image/png',
          dataUrl: highRes2d.dataUrl
        });
      } else if (shareFormat === '3d_png' && snap3d) {
        files.push({
          name: `${currentProject.name}_3D_Render.png`,
          type: 'image/png',
          dataUrl: snap3d.dataUrl
        });
      } else if (shareFormat === 'pdf' || shareFormat === 'complete_pdf') {
        const { blob, filename } = await generateComprehensiveProjectPdf(currentProject, {
          type: shareFormat === 'complete_pdf' ? 'complete' : '2d',
          pageSize: 'a4',
          orientation: 'landscape',
          highRes2dDataUrl: highRes2d.dataUrl,
          highRes3dDataUrl: snap3d?.dataUrl
        });
        // Convert blob to base64 dataUrl
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        files.push({
          name: filename,
          type: 'application/pdf',
          dataUrl
        });
      }

      await api.shareProjectWithProfessional(currentProject.id, {
        professionalId: selectedProId,
        files,
        format: shareFormat,
        message: shareMessage,
        allowEdit: allowEditableAccess
      });

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.3 } });
      setSuccessMessage(`Floor plan project successfully shared with ${selectedPro?.name || 'the professional'}! They can now review your files and respond.`);
      setIsShareConfirmStep(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to share project with professional.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !currentProject) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* ── HEADER ── */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 shrink-0">
              <Download size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">SAVE &amp; EXPORT FLOOR PLAN</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {currentProject.houseType}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Export high-resolution PNG, multi-page architectural PDF, save editable project, or share with verified professionals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── TABS ── */}
        <div className="px-6 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2 text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('png'); setSuccessMessage(null); setErrorMessage(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'png' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Layers size={14} />
            <span>Save as PNG</span>
          </button>

          <button
            onClick={() => { setActiveTab('pdf'); setSuccessMessage(null); setErrorMessage(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'pdf' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FileText size={14} />
            <span>Save as PDF</span>
          </button>

          <button
            onClick={() => { setActiveTab('save'); setSuccessMessage(null); setErrorMessage(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'save' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Save size={14} />
            <span>Save Project</span>
          </button>

          <button
            onClick={() => { setActiveTab('share'); setSuccessMessage(null); setErrorMessage(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'share' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Share2 size={14} />
            <span>Share with Professional</span>
          </button>
        </div>

        {/* ── NOTIFICATION BANNERS ── */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="flex-1">{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              <X size={14} />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── BODY CONTENT ── */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 1: SAVE AS PNG */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === 'png' && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Select View to Export:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPngViewType('2d')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                      pngViewType === '2d'
                        ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${pngViewType === '2d' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <Layers size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold">2D Floor Plan</div>
                      <div className="text-[10px] text-slate-500 font-normal">Clean CAD walls, rooms, furniture &amp; dimensions</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPngViewType('3d')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                      pngViewType === '3d'
                        ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${pngViewType === '3d' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <Box size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold">3D House Model</div>
                      <div className="text-[10px] text-slate-500 font-normal">High-res WebGL perspective snapshot</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700">Image Preview (Clean Background)</span>
                  <span className="text-[10px] text-slate-400">High Resolution 2400×1800px output</span>
                </div>
                <div className="w-full h-48 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center relative">
                  {pngPreviewUrl ? (
                    <img
                      src={pngPreviewUrl}
                      alt="Floor Plan Preview"
                      className="w-full h-full object-contain bg-white"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Loader2 size={24} className="animate-spin mx-auto mb-1 text-emerald-600" />
                      <span>Generating high-res snapshot...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              {pngViewType === '2d' && (
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={showDimensionsOnPng}
                      onChange={e => setShowDimensionsOnPng(e.target.checked)}
                      className="accent-emerald-600 w-3.5 h-3.5 rounded"
                    />
                    <span>Include Wall Dimensions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={showRoomLabelsOnPng}
                      onChange={e => setShowRoomLabelsOnPng(e.target.checked)}
                      className="accent-emerald-600 w-3.5 h-3.5 rounded"
                    />
                    <span>Include Room Labels &amp; Areas</span>
                  </label>
                </div>
              )}

              {/* Filename & Save Button */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="font-semibold text-slate-700 block">Filename:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pngFilename}
                    onChange={e => setPngFilename(e.target.value)}
                    placeholder="My_House_Floor_Plan"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-emerald-500"
                  />
                  <span className="font-mono text-slate-400 font-bold">.png</span>
                </div>

                <button
                  type="button"
                  onClick={handleExportPng}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving File to Computer...</span>
                    </>
                  ) : (
                    <>
                      <HardDrive size={16} />
                      <span>Save PNG to Device (Choose Folder)</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  Uses File System Access API to let you select destination folder. Standard download fallback provided if unsupported.
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 2: SAVE AS PDF */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Select PDF Package:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPdfExportType('complete')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      pdfExportType === 'complete'
                        ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span>Complete Project</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-1">
                      2D Plan, 3D views, full room schedule table, dimensions &amp; areas
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPdfExportType('2d')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      pdfExportType === '2d'
                        ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Layers size={14} className="text-emerald-600" />
                      <span>2D Floor Plan PDF</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-1">
                      Blueprint drawing with walls, openings, dimensions &amp; schedule
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPdfExportType('3d')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      pdfExportType === '3d'
                        ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Box size={14} className="text-emerald-600" />
                      <span>3D Model PDF</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-1">
                      Captured 3D model perspective report with design specifications
                    </p>
                  </button>
                </div>
              </div>

              {/* Format & Orientation Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Page Size:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['a4', 'a3'] as const).map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPdfPageSize(size)}
                        className={`py-1.5 rounded-lg font-bold text-center transition cursor-pointer ${
                          pdfPageSize === size ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Orientation:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['landscape', 'portrait'] as const).map(ori => (
                      <button
                        key={ori}
                        type="button"
                        onClick={() => setPdfOrientation(ori)}
                        className={`py-1.5 rounded-lg font-bold text-center transition cursor-pointer capitalize ${
                          pdfOrientation === ori ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {ori}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filename & Save Button */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="font-semibold text-slate-700 block">PDF Filename:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pdfFilename}
                    onChange={e => setPdfFilename(e.target.value)}
                    placeholder="My_House_Architectural_Report"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-emerald-500"
                  />
                  <span className="font-mono text-slate-400 font-bold">.pdf</span>
                </div>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Generating PDF &amp; Saving...</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={16} />
                      <span>Export PDF to Device (Choose Folder)</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  Executive multi-page PDF formatted with dimensions, readable scales, room areas, and high-res vector graphics.
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 3: SAVE EDITABLE PROJECT */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === 'save' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-950 text-xs">Current Project Status</div>
                  <div className="text-[10px] text-emerald-700">
                    {saveStatus === 'saved' ? 'All changes saved to database' : saveStatus === 'saving' ? 'Saving to server...' : 'You have unsaved modifications'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500">ID: {currentProject.id}</div>
                  {lastSavedTime && (
                    <div className="text-[10px] text-slate-400">
                      Last saved: {lastSavedTime.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Name & Update */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">Project Title:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editProjectName}
                    onChange={e => setEditProjectName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveProject}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>Save Project</span>
                  </button>
                </div>
              </div>

              {/* Save As (Duplicate with new name) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Copy size={14} className="text-emerald-600" />
                  <span>Save As New Project Copy</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Creates an independent duplicate in MongoDB with a unique Project ID while preserving the current one.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={saveAsName}
                    onChange={e => setSaveAsName(e.target.value)}
                    placeholder="Enter copy title"
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAs}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Save As Copy
                  </button>
                </div>
              </div>

              {/* Offline JSON Backup */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Offline Project Backup (.json)</div>
                  <div className="text-[10px] text-slate-500">Export complete coordinates, walls, rooms, and 3D configuration</div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 4: SHARE WITH PROFESSIONAL */}
          {/* ═══════════════════════════════════════════════════════ */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              {!isShareConfirmStep ? (
                <>
                  {/* Search verified professionals */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      1. Select Verified &amp; Approved Professional:
                    </label>
                    <div className="relative mb-2">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={proSearchQuery}
                        onChange={e => setProSearchQuery(e.target.value)}
                        placeholder="Search by architect name, specialization or company..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-emerald-500"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {loadingPros ? (
                        <div className="p-4 text-center text-slate-400">
                          <Loader2 size={18} className="animate-spin mx-auto mb-1 text-emerald-600" />
                          <span>Loading verified professionals...</span>
                        </div>
                      ) : filteredPros.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                          No verified professionals found matching search.
                        </div>
                      ) : (
                        filteredPros.map(pro => {
                          const proId = pro._id || (pro as any).id;
                          const isSelected = selectedProId === proId;
                          return (
                            <div
                              key={proId}
                              onClick={() => setSelectedProId(proId)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={pro.profileImage || pro.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pro.name}`}
                                  alt={pro.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <span>{pro.name}</span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                                      {pro.specialization}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {pro.companyName || 'Architecture Studio'} · {pro.experience} · ★ {pro.rating || '5.0'}
                                  </div>
                                </div>
                              </div>
                              <input
                                type="radio"
                                checked={isSelected}
                                onChange={() => setSelectedProId(proId)}
                                className="accent-emerald-600"
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* What to share format */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      2. Choose Content to Share:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setShareFormat('complete_pdf')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          shareFormat === 'complete_pdf'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">Complete Project PDF</div>
                        <div className="text-[10px] text-slate-500 font-normal">2D Plan + 3D Views + Room Schedules</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShareFormat('pdf')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          shareFormat === 'pdf'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">2D Floor Plan PDF</div>
                        <div className="text-[10px] text-slate-500 font-normal">Dimensioned technical blueprint</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShareFormat('png')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          shareFormat === 'png'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">2D Plan as PNG Image</div>
                        <div className="text-[10px] text-slate-500 font-normal">High-res vector floor plan image</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShareFormat('3d_png')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          shareFormat === '3d_png'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">3D Model Snapshot PNG</div>
                        <div className="text-[10px] text-slate-500 font-normal">Perspective rendering of current model</div>
                      </button>
                    </div>
                  </div>

                  {/* Consultation Message */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      3. Consultation Request Message:
                    </label>
                    <textarea
                      rows={2}
                      value={shareMessage}
                      onChange={e => setShareMessage(e.target.value)}
                      placeholder="Describe requested modifications, questions or budget details..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-emerald-500 resize-none"
                    />
                  </div>

                  {/* Grant Editable Access Toggle */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">Allow Professional to Edit Copy</div>
                      <div className="text-[10px] text-slate-500">
                        Preserves your original project while allowing the professional to provide revised drafts.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowEditableAccess}
                        onChange={e => setAllowEditableAccess(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedProId) {
                        setErrorMessage('Please select a professional from the list above.');
                        return;
                      }
                      setIsShareConfirmStep(true);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Proceed to Confirmation</span>
                    <ArrowRight size={14} />
                  </button>
                </>
              ) : (
                /* Confirmation Screen */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                    <h4 className="font-bold text-emerald-950 text-sm">Confirm Professional Sharing</h4>
                    <p className="text-xs text-emerald-800">
                      You are about to securely share your floor plan with verified professional:
                    </p>
                    <div className="p-3 bg-white rounded-lg border border-emerald-100 flex items-center gap-3">
                      <img
                        src={selectedPro?.profileImage || selectedPro?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPro?.name}`}
                        alt={selectedPro?.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{selectedPro?.name}</div>
                        <div className="text-[10px] text-slate-500">{selectedPro?.specialization} · {selectedPro?.companyName}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-700 space-y-1 pt-1">
                      <div><strong className="text-slate-900">Project:</strong> {currentProject.name}</div>
                      <div><strong className="text-slate-900">Package Format:</strong> {shareFormat.replace('_', ' ').toUpperCase()}</div>
                      <div><strong className="text-slate-900">Permission:</strong> {allowEditableAccess ? 'Editable Draft Permitted' : 'Read-Only Document'}</div>
                      {shareMessage && <div><strong className="text-slate-900">Message:</strong> &ldquo;{shareMessage}&rdquo;</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsShareConfirmStep(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSendToProfessional}
                      disabled={isProcessing}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/25 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Sending to Professional...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Confirm &amp; Share</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            {currentProject.plotWidth}×{currentProject.plotLength} {currentProject.unit} · {currentProject.rooms.length} rooms
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

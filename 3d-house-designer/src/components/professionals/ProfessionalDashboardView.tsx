import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../services/api';
import { ChatPricingPlan, PaymentTransaction } from '../../types/floorplan';
import {
  Inbox,
  MessageSquare,
  CheckCircle2,
  XCircle,
  LogOut,
  Edit,
  Save,
  Box,
  Eye,
  ArrowRight,
  CreditCard,
  TrendingUp,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Star,
  ShieldCheck,
  User,
  Camera,
  Upload,
  X
} from 'lucide-react';

import confetti from 'canvas-confetti';

interface ProfessionalDashboardViewProps {
  onOpenChat: () => void;
  onOpenSharedProjectIn3D: (projectId: string) => void;
  onBackToMainDashboard?: () => void;
}

export const ProfessionalDashboardView: React.FC<ProfessionalDashboardViewProps> = ({
  onOpenChat,
  onOpenSharedProjectIn3D,
  onBackToMainDashboard
}) => {
  const { chatRequests, acceptChatRequest, rejectChatRequest, conversations, selectConversation } = useChat();
  const { user, logout, updateProfile } = useAuth();
  const { loadExternalProject } = useProject();

  const [activeTab, setActiveTab] = useState<'requests' | 'conversations' | 'pricing' | 'earnings' | 'profile'>('requests');

  // Professional Profile Form state
  const [specialization, setSpecialization] = useState(user?.specialization || 'Architect');
  const [experience, setExperience] = useState('8+ years');
  const [description, setDescription] = useState(
    'Licensed professional providing architectural consultations, floor plan optimization, and 3D interior flow reviews.'
  );
  const [availability, setAvailability] = useState<'available' | 'busy' | 'offline'>('available');
  const [hourlyRate, setHourlyRate] = useState('₹199 / 30m');
  const [proAvatar, setProAvatar] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);
  const [previewModalFile, setPreviewModalFile] = useState<{ url: string; name: string; type: string } | null>(null);

  const proFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.avatar) {
      setProAvatar(user.avatar);
    }
  }, [user]);

  const handleProAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProAvatar(dataUrl);
      updateProfile({ avatar: dataUrl });
      api.updateProfessionalProfile({ profileImage: dataUrl }).catch(() => {});
    };
    reader.readAsDataURL(file);
  };


  // Chat Pricing Configuration State
  const [pricingPlans, setPricingPlans] = useState<ChatPricingPlan[]>([
    { durationMinutes: 30, price: 199, label: '30 Minutes' },
    { durationMinutes: 60, price: 349, label: '60 Minutes' }
  ]);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingSavedNotice, setPricingSavedNotice] = useState(false);

  // Professional Earnings State
  const [earningsData, setEarningsData] = useState<{
    metrics: {
      totalEarnings: number;
      totalPaidChats: number;
      completedChats: number;
      pendingEarnings: number;
    };
    transactions: PaymentTransaction[];
  } | null>(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);

  const currentUserId = user?.id || user?._id;

  // Load Pricing
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await api.getProPricing(currentUserId || '');
        if (res.chatPricing && res.chatPricing.length > 0) {
          setPricingPlans(res.chatPricing);
        }
      } catch (err) {
        // Fallback default
      }
    };
    if (currentUserId) fetchPricing();
  }, [currentUserId]);

  // Load Earnings when tab is active
  useEffect(() => {
    if (activeTab === 'earnings') {
      const fetchEarnings = async () => {
        setLoadingEarnings(true);
        try {
          const res = await api.getProEarnings();
          setEarningsData({
            metrics: res.metrics,
            transactions: res.transactions
          });
        } catch (err) {
          console.warn('Could not fetch earnings:', err);
        } finally {
          setLoadingEarnings(false);
        }
      };
      fetchEarnings();
    }
  }, [activeTab]);

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPricing(true);
    try {
      await api.updateProPricing(pricingPlans);
      setPricingSavedNotice(true);
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.25 } });
      setTimeout(() => setPricingSavedNotice(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update pricing plans.');
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleAddTier = () => {
    setPricingPlans(prev => [
      ...prev,
      { durationMinutes: 45, price: 299, label: '45 Minutes', isActive: true }
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (pricingPlans.length <= 1) {
      alert('At least one consultation duration plan is required.');
      return;
    }
    setPricingPlans(prev => prev.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof ChatPricingPlan, value: any) => {
    setPricingPlans(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Requests directed to this professional
  const incomingRequests = chatRequests.filter(r => {
    const recId = typeof r.receiverId === 'object' ? (r.receiverId as any)._id || (r.receiverId as any).id : r.receiverId;
    return String(recId) === String(currentUserId);
  });

  const pendingRequests = incomingRequests.filter(r => r.status === 'pending');

  const handleAccept = async (requestId: string) => {
    const convId = await acceptChatRequest(requestId);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.2 } });
    if (convId) {
      await selectConversation(convId);
      onOpenChat();
    }
  };

  const handleReject = async (requestId: string) => {
    await rejectChatRequest(requestId);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.updateProfessionalProfile({
        specialization: specialization as any,
        experience,
        description,
        availability,
        hourlyRate,
        profileImage: proAvatar
      });
      await updateProfile({ specialization, avatar: proAvatar });
      setProfileSavedNotice(true);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.2 } });
      setTimeout(() => setProfileSavedNotice(false), 2500);
    } catch (err) {
      console.warn('Saved locally:', err);
      setProfileSavedNotice(true);
      setTimeout(() => setProfileSavedNotice(false), 2500);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-full flex-1 flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-xs overflow-hidden border border-emerald-700/20">
            {user?.avatar || proAvatar ? (
              <img
                src={user?.avatar || proAvatar}
                alt={user?.name || 'PRO'}
                className="w-full h-full object-cover"
              />
            ) : (
              'PRO'
            )}
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{user?.name || 'Professional Workspace'}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                {specialization}
              </span>
            </h1>
            <p className="text-xs text-slate-500">Client Consultation & 3D Floor Plan Review Console</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onBackToMainDashboard && (
            <button
              onClick={onBackToMainDashboard}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              Floor Plan Studio
            </button>
          )}

          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <MessageSquare size={16} />
            <span>Messages ({conversations.length})</span>
          </button>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Pending Requests</span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <Clock size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{pendingRequests.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting your review</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Active Consultations</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <MessageSquare size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{conversations.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Active client chats</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Professional Rating</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Star size={18} fill="currentColor" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">4.98 ★</div>
            <p className="text-[11px] text-slate-500 mt-1">38 verified reviews</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Hourly Rate</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{hourlyRate}</div>
            <p className="text-[11px] text-slate-500 mt-1">Consultation fee</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Inbox size={15} />
            <span>Chat Requests</span>
            {pendingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-[10px]">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'conversations'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <MessageSquare size={15} />
            <span>Client Conversations ({conversations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <CreditCard size={15} />
            <span>Chat Pricing Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'earnings'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <TrendingUp size={15} />
            <span>Earnings & Consultations</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <User size={15} />
            <span>My Professional Profile</span>
          </button>
        </div>

        {/* TAB 1: INCOMING REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {incomingRequests.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                <Inbox size={36} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-800">No Chat Requests Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When normal users discover your profile and ask for consultations on their 3D floor plans, their requests will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incomingRequests.map(req => {
                  const sender = typeof req.senderId === 'object' ? (req.senderId as any) : null;
                  const senderName = sender?.name || 'Home Designer';
                  const senderAvatar =
                    sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`;

                  return (
                    <div
                      key={req._id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs"
                    >
                      {/* Sender Info & Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={senderAvatar}
                            alt={senderName}
                            className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200"
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">{senderName}</h4>
                            <span className="text-[10px] text-slate-400">
                              {new Date(req.createdAt).toLocaleDateString()} at{' '}
                              {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                            req.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : req.status === 'accepted'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      {/* Inquiry Message */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Client Note:</p>
                        {req.message}
                      </div>

                      {/* Attached Floor Plan Card */}
                      {req.projectSnapshot && (
                        <>
                          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  req.projectSnapshot.thumbnail ||
                                  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80'
                                }
                                alt={req.projectSnapshot.name}
                                className="w-14 h-12 rounded-lg object-cover border border-slate-200"
                              />
                              <div>
                                <span className="text-[10px] font-bold text-emerald-800 uppercase">
                                  {req.projectSnapshot.houseType}
                                </span>
                                <h5 className="font-bold text-slate-900 text-xs">{req.projectSnapshot.name}</h5>
                                <p className="text-[10px] text-slate-500">
                                  {req.projectSnapshot.plotWidth}×{req.projectSnapshot.plotLength} {req.projectSnapshot.unit}
                                </p>
                                {req.projectSnapshot.format && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded mt-0.5 inline-block">
                                    {req.projectSnapshot.format.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  if (req.projectSnapshot) {
                                    loadExternalProject(req.projectSnapshot as any);
                                    onOpenSharedProjectIn3D(req.projectSnapshot.id);
                                  }
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition cursor-pointer shadow-xs"
                                title="Open in 3D WebGL Studio"
                              >
                                <Box size={13} />
                                <span>Inspect 3D</span>
                              </button>
                            </div>
                          </div>

                          {/* Shared Attached PNG / PDF Files */}
                          {req.projectSnapshot.sharedFiles && req.projectSnapshot.sharedFiles.length > 0 && (
                            <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                                Attached Project Documents ({req.projectSnapshot.sharedFiles.length}):
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {req.projectSnapshot.sharedFiles.map((file: any, fIdx: number) => (
                                  <div
                                    key={fIdx}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs"
                                  >
                                    <span className="max-w-[150px] truncate">{file.name}</span>
                                    {file.dataUrl && (
                                      <div className="flex items-center gap-1.5 ml-1">
                                        {file.type?.includes('image') && (
                                          <button
                                            type="button"
                                            onClick={() => setPreviewModalFile({ url: file.dataUrl, name: file.name, type: file.type })}
                                            className="text-emerald-700 hover:underline text-[11px] font-bold cursor-pointer"
                                          >
                                            Preview
                                          </button>
                                        )}
                                        <a
                                          href={file.dataUrl}
                                          download={file.name}
                                          className="text-blue-600 hover:underline text-[11px] font-bold"
                                        >
                                          Download
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Actions */}
                      {req.status === 'pending' ? (
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleReject(req._id)}
                            className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            <XCircle size={14} />
                            <span>Decline</span>
                          </button>

                          <button
                            onClick={() => handleAccept(req._id)}
                            className="flex items-center gap-1 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                            <span>Accept & Open Chat</span>
                          </button>
                        </div>
                      ) : req.status === 'accepted' ? (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                          <button
                            onClick={onOpenChat}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            <MessageSquare size={14} />
                            <span>Continue Chat</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONVERSATIONS LIST */}
        {activeTab === 'conversations' && (
          <div className="space-y-4">
            {conversations.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                <MessageSquare size={36} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-800">No Active Conversations</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Accept incoming chat requests to begin consulting with clients.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversations.map(conv => {
                  const partner = conv.participants.find(
                    p => String(typeof p === 'object' ? p._id : p) !== String(currentUserId)
                  ) as any;
                  const partnerName = partner?.name || 'Client';
                  const partnerAvatar =
                    partner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerName}`;

                  return (
                    <div
                      key={conv._id}
                      onClick={async () => {
                        await selectConversation(conv._id);
                        onOpenChat();
                      }}
                      className="p-5 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl flex items-center justify-between cursor-pointer group transition shadow-xs hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={partnerAvatar}
                          alt={partnerName}
                          className="w-12 h-12 rounded-xl bg-slate-100 object-cover border border-slate-200"
                        />
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition">
                            {partnerName}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {conv.lastMessage || 'No messages yet.'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(conv.lastMessageAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button className="p-2 bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white rounded-xl transition text-slate-500 cursor-pointer">
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFESSIONAL PROFILE MANAGEMENT */}
        {activeTab === 'profile' && (
          <form
            onSubmit={handleSaveProfile}
            className="p-6 bg-white border border-slate-200 rounded-2xl max-w-2xl mx-auto space-y-5 text-xs text-slate-700 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Manage Professional Profile</h3>
                <p className="text-[11px] text-slate-500">
                  This information will be displayed to users looking for design professionals.
                </p>
              </div>
              {profileSavedNotice && (
                <span className="flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                  <CheckCircle2 size={14} />
                  <span>Profile Updated!</span>
                </span>
              )}
            </div>

            {/* Professional Profile Photo Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
              <input
                type="file"
                ref={proFileInputRef}
                onChange={handleProAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="relative group">
                {proAvatar ? (
                  <img
                    src={proAvatar}
                    alt={user?.name || 'Professional'}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white text-xl font-black shadow-xs">
                    {(user?.name || 'Pro').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => proFileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs transition cursor-pointer border border-white"
                  title="Upload New Profile Photo"
                >
                  <Camera size={12} />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="text-xs font-bold text-slate-800">Consultation Profile Picture</div>
                <p className="text-[11px] text-slate-500">
                  This picture appears on the directory listings, booking cards, and consultation chat.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => proFileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload size={12} />
                    <span>Upload New Photo</span>
                  </button>
                  {proAvatar && (
                    <button
                      type="button"
                      onClick={() => {
                        setProAvatar('');
                        updateProfile({ avatar: '' });
                      }}
                      className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 px-2 py-1 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Specialization</label>
                <select
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
                >
                  <option value="Architect">Architect</option>
                  <option value="Interior Designer">Interior Designer</option>
                  <option value="Builder">Builder & Contractor</option>
                  <option value="Landscape Designer">Landscape Designer</option>
                  <option value="Structural Engineer">Structural Engineer</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Experience</label>
                <input
                  type="text"
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  placeholder="e.g. 10+ years"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Availability Status</label>
                <select
                  value={availability}
                  onChange={e => setAvailability(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
                >
                  <option value="available">Available for Consultation</option>
                  <option value="busy">Busy / Limited Spots</option>
                  <option value="offline">Away / Offline</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Hourly Consultation Rate</label>
                <input
                  type="text"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(e.target.value)}
                  placeholder="e.g. $120/hr"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Professional Biography</label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your design philosophy, architectural background, and consultation methodology..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 resize-none leading-relaxed transition"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-emerald-500/20 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Save size={14} />
                <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: CHAT PRICING CONFIGURATION */}
        {activeTab === 'pricing' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-600" />
                  <span>Consultation Chat Pricing Configuration</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure your session duration options and consultation fees. Payments are securely collected in INR via Razorpay.
                </p>
              </div>

              {pricingSavedNotice && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold animate-in fade-in">
                  <CheckCircle2 size={15} />
                  <span>Pricing plans updated and verified on server!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSavePricing} className="space-y-4">
              <div className="space-y-3">
                {pricingPlans.map((plan, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center gap-4"
                  >
                    <div className="w-full md:w-1/4">
                      <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                        Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        step="5"
                        value={plan.durationMinutes}
                        onChange={e => handleTierChange(idx, 'durationMinutes', parseInt(e.target.value) || 30)}
                        required
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 font-mono font-bold"
                      />
                    </div>

                    <div className="w-full md:w-2/5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                        Plan Display Label
                      </label>
                      <input
                        type="text"
                        value={plan.label || `${plan.durationMinutes} Minutes`}
                        onChange={e => handleTierChange(idx, 'label', e.target.value)}
                        placeholder="e.g. 30 Minutes Consultation"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>

                    <div className="w-full md:w-1/4">
                      <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                        Fee (₹ INR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="50"
                          max="20000"
                          step="10"
                          value={plan.price}
                          onChange={e => handleTierChange(idx, 'price', parseInt(e.target.value) || 199)}
                          required
                          className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-4 md:pt-4 flex items-center justify-end w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        disabled={pricingPlans.length <= 1}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 rounded-xl transition cursor-pointer"
                        title="Remove Tier"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Duration Tier</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingPricing}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Save size={14} />
                  <span>{isSavingPricing ? 'Saving Plans...' : 'Save Pricing Plans'}</span>
                </button>
              </div>

              {/* Server Security Note */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <span className="font-bold">Server-Side Price Validation Active:</span> When clients book consultations, the backend verifies prices strictly from your configured database pricing plans. Clients cannot tamper with order amounts.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: EARNINGS & CONSULTATIONS */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Earnings Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">Total Consultations</span>
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <MessageSquare size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {earningsData?.metrics?.totalPaidChats || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Paid client consultations</p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">Completed Sessions</span>
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {earningsData?.metrics?.completedChats || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Successfully concluded</p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">Total Gross Earnings</span>
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  ₹{earningsData?.metrics?.totalEarnings || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Total revenue collected</p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">Pending / In-Session</span>
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  ₹{earningsData?.metrics?.pendingEarnings || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Active sessions</p>
              </div>
            </div>

            {/* Transactions History Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Paid Consultation Transaction History</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Razorpay sandbox transactions verified for your professional profile
                  </p>
                </div>
              </div>

              {loadingEarnings ? (
                <div className="p-12 text-center text-slate-400 text-xs">Loading transaction history...</div>
              ) : !earningsData?.transactions || earningsData.transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <CreditCard size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-medium">No paid consultations yet.</p>
                  <p className="text-[11px] text-slate-400">
                    When clients book paid chat sessions with you, payment records will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Transaction / Date</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Consultation Fee</th>
                        <th className="py-3 px-4">Gateway Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {earningsData.transactions.map(tx => {
                        const clientName =
                          typeof tx.userId === 'object' ? (tx.userId as any).name : 'Homeowner';
                        const clientEmail =
                          typeof tx.userId === 'object' ? (tx.userId as any).email : '';

                        return (
                          <tr key={tx._id || tx.paymentId} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-800 block text-[11px]">
                                {tx.paymentId}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800 block">{clientName}</span>
                              <span className="text-[10px] text-slate-400">{clientEmail}</span>
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                              {tx.chatDuration} Mins
                            </td>
                            <td className="py-3 px-4 font-mono font-black text-emerald-700 text-sm">
                              ₹{tx.chatFee || tx.amount}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  tx.status === 'SUCCESS'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : tx.status === 'REFUNDED'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {tx.status === 'SUCCESS' ? 'PAID ✓' : tx.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={onOpenChat}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-[11px] transition cursor-pointer"
                              >
                                View Chat
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* File Preview Modal */}
      {previewModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in duration-150">
            <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-900 text-sm truncate">{previewModalFile.name}</span>
              <div className="flex items-center gap-3">
                <a
                  href={previewModalFile.url}
                  download={previewModalFile.name}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition"
                >
                  Download File
                </a>
                <button
                  onClick={() => setPreviewModalFile(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-900">
              <img
                src={previewModalFile.url}
                alt={previewModalFile.name}
                className="max-h-[75vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

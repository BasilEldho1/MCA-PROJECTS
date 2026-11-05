import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { Message, ProjectSnapshot, User, PaidChatSession, Professional } from '../../types/floorplan';
import { api } from '../../services/api';
import { ShareProjectModal } from './ShareProjectModal';
import { PaymentCheckoutModal } from '../payment/PaymentCheckoutModal';
import {
  Send,
  Share2,
  Box,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  MessageSquare,
  Search,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Bot,
  AlertCircle,
  Lock,
  Sparkles,
  ChevronRight,
  CreditCard
} from 'lucide-react';

interface ChatViewProps {
  onBackToDashboard: () => void;
  onOpenSharedProjectIn3D: (projectId: string) => void;
  onOpenAIChatBot?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  onBackToDashboard,
  onOpenSharedProjectIn3D,
  onOpenAIChatBot
}) => {
  const {
    conversations,
    activeConversation,
    selectConversation,
    messages,
    sendMessage,
    activeTypingUser,
    sendTyping,
    sendStopTyping,
    onlineUserIds,
    isLoading,
    professionals
  } = useChat();

  const { user } = useAuth();
  const { loadExternalProject } = useProject();

  const [inputMessage, setInputMessage] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Paid Session & Countdown Timer State
  const [paidSession, setPaidSession] = useState<PaidChatSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = user?.id || user?._id;

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTypingUser]);

  // Fetch Paid Chat Session Details for Active Conversation
  useEffect(() => {
    if (!activeConversation) {
      setPaidSession(null);
      setRemainingSeconds(0);
      setIsSessionExpired(false);
      return;
    }

    let isMounted = true;
    const loadSession = async () => {
      try {
        const res = await api.getConversationSession(activeConversation._id);
        if (isMounted) {
          setPaidSession(res.session);
          setRemainingSeconds(res.remainingSeconds || 0);
          setIsSessionExpired(res.isExpired || (res.session ? res.remainingSeconds <= 0 : false));
        }
      } catch (e) {
        console.warn('Could not retrieve paid chat session for conversation:', e);
      }
    };

    loadSession();
    return () => {
      isMounted = false;
    };
  }, [activeConversation]);

  // Countdown Timer Interval (controlled by server remainingSeconds)
  useEffect(() => {
    if (!paidSession || remainingSeconds <= 0 || isSessionExpired) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setIsSessionExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paidSession, remainingSeconds, isSessionExpired]);

  // Select first conversation if none selected
  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      selectConversation(conversations[0]._id);
    }
  }, [conversations, activeConversation, selectConversation]);

  // Format remaining seconds into MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndSession = async () => {
    if (!paidSession) return;
    if (!window.confirm('Are you sure you want to end this paid chat session?')) return;
    try {
      await api.endChatSession(paidSession.id || (paidSession as any)._id);
      setIsSessionExpired(true);
      setRemainingSeconds(0);
    } catch (err: any) {
      alert(err.message || 'Failed to end chat session.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    if (isSessionExpired) {
      alert('Your consultation session has ended. Please purchase a new session to continue chatting.');
      return;
    }

    sendStopTyping();
    const textToSend = inputMessage;
    setInputMessage('');
    try {
      await sendMessage(textToSend);
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (e.target.value.trim()) {
      sendTyping();
    } else {
      sendStopTyping();
    }
  };

  // Quick inquiry preset pills
  const handleQuickPrompt = (text: string) => {
    if (isSessionExpired) {
      setIsExtendModalOpen(true);
      return;
    }
    setInputMessage(text);
  };

  // Get conversation partner info
  const getPartner = (conv: typeof activeConversation) => {
    if (!conv) return null;
    const p = conv.participants.find(
      part => String(typeof part === 'object' ? part._id : part) !== String(currentUserId)
    );
    return typeof p === 'object' ? (p as User) : null;
  };

  const activePartner = getPartner(activeConversation);
  const isPartnerOnline = activePartner
    ? onlineUserIds.includes(String(activePartner._id || activePartner.id))
    : true; // Default online for demonstration

  // Resolve active partner as a Professional object if applicable
  const partnerPro: Professional | null = (() => {
    if (!activePartner) return null;
    const pId = activePartner._id || activePartner.id;
    const found = professionals.find(pro => {
      const proUserId = typeof pro.userId === 'object' ? (pro.userId as any)._id : pro.userId;
      return String(proUserId) === String(pId) || String(pro.id) === String(pId);
    });
    if (found) return found;
    if (activePartner.role === 'professional') {
      return {
        _id: String(pId),
        id: String(pId),
        userId: String(pId),
        name: activePartner.name,
        email: activePartner.email || 'pro@example.com',
        specialization: ((activePartner.specialization as any) || 'Architect') as any,
        experience: '5+ years',
        description: 'Licensed professional available for paid design reviews.',
        profileImage:
          activePartner.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${activePartner.name}`,
        availability: 'available',
        verificationStatus: 'verified',
        rating: 4.9,
        reviewsCount: 24,
        hourlyRate: '₹199 / 30m',
        chatPricing: [
          { durationMinutes: 30, price: 199, label: '30 Minutes' },
          { durationMinutes: 60, price: 349, label: '60 Minutes' }
        ]
      };
    }
    return null;
  })();

  const filteredConversations = conversations.filter(conv => {
    const partner = getPartner(conv);
    return partner?.name?.toLowerCase().includes(conversationSearch.toLowerCase()) || false;
  });

  const handleOpenSharedFloorPlan = (snapshot: ProjectSnapshot) => {
    // Load into 3D Project Context
    loadExternalProject(snapshot as any);
    onOpenSharedProjectIn3D(snapshot.id);
  };

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-emerald-100 px-4 md:px-6 flex items-center justify-between shadow-xs z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
            >
              {mobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <h1 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2">
              <MessageSquare size={18} className="text-emerald-600" />
              <span>Architect Consultation Studio</span>
            </h1>
          </div>
        </div>

        {activePartner && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isPartnerOnline ? 'bg-emerald-500 shadow shadow-emerald-500/50' : 'bg-slate-400'
              }`}
            />
            <span className="text-slate-800 font-bold">{activePartner.name}</span>
            {activePartner.role === 'professional' && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                PRO ARCHITECT
              </span>
            )}
          </div>
        )}
      </header>

      {/* 2-Pane Chat Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANE: Conversations List */}
        <aside
          className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 transition-transform duration-200 absolute md:static inset-y-0 left-0 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* AI Architect Scanner Bot Card */}
          <div className="p-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div
              onClick={onOpenAIChatBot}
              className="p-3 bg-white border border-emerald-200 hover:border-emerald-400 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>AI Blueprint Scanner Bot</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                      AI 2.0
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500">Scan &amp; convert blueprint images to 2D</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-emerald-600 group-hover:translate-x-0.5 transition" />
            </div>
          </div>

          {/* Search Conversations */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search architects & chats..."
                value={conversationSearch}
                onChange={e => setConversationSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Conversations Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active conversations found.
              </div>
            ) : (
              filteredConversations.map(conv => {
                const partner = getPartner(conv);
                const isSelected = activeConversation?._id === conv._id;
                const isOnline = partner
                  ? onlineUserIds.includes(String(partner._id || partner.id))
                  : true;

                const partnerName = partner?.name || 'Arjun Thomas';
                const partnerAvatar =
                  (partner?.avatar || '') ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(partnerName)}`;
                const resolvedPartnerAvatar = partnerAvatar.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(partnerName)}`;

                return (
                  <div
                    key={conv._id}
                    onClick={() => {
                      selectConversation(conv._id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={resolvedPartnerAvatar}
                        alt={partnerName}
                        className="w-11 h-11 rounded-2xl object-cover bg-slate-100 border border-slate-200"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                          <span>{partnerName}</span>
                          {partner?.role === 'professional' && (
                            <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {new Date(conv.lastMessageAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate">
                        {conv.lastMessage || 'Click to view dialogue'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANE: Active Chat Window */}
        <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          {activeConversation && activePartner ? (
            <>
              {/* Active Conversation Header */}
              <div className="h-16 px-6 border-b border-emerald-100 bg-white flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={
                        (activePartner.avatar && activePartner.avatar.trim())
                          ? activePartner.avatar
                          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activePartner.name)}`
                      }
                      alt={activePartner.name}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        isPartnerOnline ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span>{activePartner.name}</span>
                      {activePartner.specialization && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                          {activePartner.specialization}
                        </span>
                      )}
                      {(activePartner.role === 'professional' || partnerPro) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                          <ShieldCheck size={11} className="text-emerald-600" />
                          <span>Verified Professional ✓</span>
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Online • Available for 3D Review</span>
                    </p>
                  </div>
                </div>

                {/* Right Header: Timer & Actions */}
                <div className="flex items-center gap-2.5">
                  {paidSession ? (
                    !isSessionExpired && remainingSeconds > 0 ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition shadow-xs ${
                            remainingSeconds <= 300
                              ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          }`}
                        >
                          <Clock size={14} className={remainingSeconds <= 300 ? 'text-rose-600' : 'text-emerald-600'} />
                          <span>Remaining Time: {formatTime(remainingSeconds)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleEndSession}
                          className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          End Session
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold font-mono">
                          <AlertCircle size={13} />
                          <span>Chat Session Ended</span>
                        </div>
                        {partnerPro && (
                          <button
                            type="button"
                            onClick={() => setIsExtendModalOpen(true)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            Extend Session
                          </button>
                        )}
                      </div>
                    )
                  ) : partnerPro ? (
                    <button
                      type="button"
                      onClick={() => setIsExtendModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <CreditCard size={13} />
                      <span>Start Paid Consultation</span>
                    </button>
                  ) : null}

                  {/* Top Action: Share Floor Plan */}
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <Share2 size={13} />
                    <span>Share Floor Plan</span>
                  </button>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                      <MessageSquare size={24} />
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">
                      Consultation with {activePartner.name}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Send a message or share your floor plan blueprint to review 3D room layouts.
                    </p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = String(typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId) === String(currentUserId);

                    return (
                      <div
                        key={msg._id || Math.random().toString()}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm space-y-2.5 ${
                            isMe
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                          }`}
                        >
                          {/* Message Text */}
                          {(msg.message || msg.content) && (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
                              {msg.message || msg.content}
                            </p>
                          )}

                          {/* Interactive 3D Project Snapshot Card */}
                          {(msg.projectSnapshot || msg.sharedProject) && (() => {
                            const snap = msg.projectSnapshot || msg.sharedProject;
                            return (
                              <div className="bg-emerald-50/60 border border-emerald-200 text-slate-800 rounded-2xl overflow-hidden shadow-xs p-3 space-y-3">
                                {/* Blueprint Preview Frame */}
                                <div className="relative h-28 bg-white rounded-xl border border-emerald-100 flex items-center justify-center overflow-hidden">
                                  <div 
                                    className="absolute inset-0 opacity-20 pointer-events-none"
                                    style={{
                                      backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
                                      backgroundSize: '16px 16px'
                                    }}
                                  />
                                  <svg viewBox="0 0 160 100" className="w-40 h-24 stroke-emerald-600 fill-emerald-50/50">
                                    <rect x="15" y="15" width="130" height="70" strokeWidth="2" rx="3" />
                                    <line x1="65" y1="15" x2="65" y2="85" strokeWidth="1.5" strokeDasharray="3 3" />
                                    <text x="25" y="55" fill="#047857" fontSize="9" fontFamily="monospace" fontWeight="bold">LIVING</text>
                                    <text x="85" y="45" fill="#047857" fontSize="8" fontFamily="monospace" fontWeight="bold">MASTER BED</text>
                                  </svg>
                                  <span className="absolute top-2 left-2 text-[9px] font-mono font-bold px-2 py-0.5 bg-white text-emerald-800 border border-emerald-200 rounded">
                                    {snap!.houseType} • {snap!.floorsCount} FL
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <h5 className="font-black text-slate-900 text-xs">
                                    {snap!.name}
                                  </h5>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                                    <span>{snap!.plotWidth} × {snap!.plotLength} {snap!.unit}</span>
                                    <span>•</span>
                                    <span>{snap!.walls?.length || 14} Walls</span>
                                    <span>•</span>
                                    <span>{snap!.rooms?.length || snap!.roomsCount || 5} Rooms</span>
                                  </div>
                                </div>

                                {/* Interactive Launch Button */}
                                <button
                                  onClick={() => handleOpenSharedFloorPlan(snap!)}
                                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
                                >
                                  <Box size={14} />
                                  <span>Open in 3D View</span>
                                </button>
                              </div>
                            );
                          })()}

                          {/* Time & Read Status */}
                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] ${
                              isMe ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {isMe && <CheckCheck size={12} className="text-emerald-100" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {activeTypingUser && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>{activeTypingUser} is typing a response...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Inquiry Pills Bar */}
              <div className="px-6 py-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider shrink-0">
                  Quick Inquiries:
                </span>
                {[
                  'I need a 3 bedroom house plan.',
                  'Can you inspect structural wall positions in 3D?',
                  'What is the estimated construction cost per sq.ft?',
                  'Can you add an open courtyard to this layout?'
                ].map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickPrompt(promptText)}
                    className="px-3 py-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 hover:border-emerald-300 text-[11px] font-medium rounded-xl border border-slate-200 whitespace-nowrap transition cursor-pointer"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {/* Session Expired Notice Banner */}
              {isSessionExpired && (
                <div className="p-3 bg-amber-50 border-t border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={18} className="text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold">Chat Session Ended.</span> Consultation duration has concluded.
                    </div>
                  </div>
                  {partnerPro && (
                    <button
                      type="button"
                      onClick={() => setIsExtendModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CreditCard size={14} />
                      <span>Start Another Paid Session</span>
                    </button>
                  )}
                </div>
              )}

              {/* Bottom Input Field Bar */}
              <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    disabled={isSessionExpired}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 disabled:opacity-40 disabled:hover:bg-slate-50 text-emerald-700 rounded-xl border border-slate-200 hover:border-emerald-300 transition shrink-0 cursor-pointer"
                    title="Share 3D Floor Plan"
                  >
                    <Share2 size={16} />
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    disabled={isSessionExpired}
                    placeholder={
                      isSessionExpired
                        ? 'Chat session ended. Please start another session to message.'
                        : `Message ${activePartner.name}... (Press Enter to send)`
                    }
                    className={`flex-1 py-2.5 px-4 border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition ${
                      isSessionExpired
                        ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-70'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'
                    }`}
                  />

                  <button
                    type="submit"
                    disabled={isSessionExpired || !inputMessage.trim()}
                    className="flex items-center justify-center p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl shadow-md shadow-emerald-600/20 transition shrink-0 cursor-pointer"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div className="space-y-2 text-slate-400">
                <MessageSquare size={32} className="mx-auto opacity-40 text-emerald-600" />
                <p className="text-xs">Select an architect conversation from the sidebar.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Share Floor Plan Modal */}
      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Payment / Extend Consultation Modal */}
      <PaymentCheckoutModal
        isOpen={isExtendModalOpen}
        professional={partnerPro}
        onClose={() => setIsExtendModalOpen(false)}
        onPaymentSuccess={async session => {
          setIsExtendModalOpen(false);
          if (activeConversation) {
            try {
              const res = await api.getConversationSession(activeConversation._id);
              setPaidSession(res.session);
              setRemainingSeconds(res.remainingSeconds || 0);
              setIsSessionExpired(res.isExpired || false);
            } catch (err) {
              console.warn('Failed to refresh conversation session:', err);
            }
          }
        }}
      />
    </div>
  );
};

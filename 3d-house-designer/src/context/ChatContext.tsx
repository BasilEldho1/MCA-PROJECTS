import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Professional,
  ChatRequest,
  Conversation,
  Message,
  Project,
  ProjectSnapshot,
  User
} from '../types/floorplan';
import { api } from '../services/api';
import { initSocket, socketService } from '../services/socket';
import { useAuth } from './AuthContext';

interface ChatContextType {
  professionals: Professional[];
  selectedProfessional: Professional | null;
  chatRequests: ChatRequest[];
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  activeTypingUser: string | null;
  unreadCount: number;
  pendingRequestsCount: number;
  onlineUserIds: string[];
  isLoading: boolean;

  // Actions
  setSelectedProfessional: (pro: Professional | null) => void;
  loadProfessionals: (search?: string, specialization?: string) => Promise<void>;
  loadChatRequests: () => Promise<void>;
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendChatRequest: (
    receiverId: string,
    message?: string,
    projectId?: string | null,
    projectSnapshot?: ProjectSnapshot | null
  ) => Promise<{ success: boolean; message?: string }>;
  acceptChatRequest: (requestId: string) => Promise<string | null>;
  rejectChatRequest: (requestId: string) => Promise<boolean>;
  sendMessage: (text: string) => Promise<void>;
  shareProject: (project: Project, note?: string) => Promise<void>;
  getOrCreateConversation: (receiverId: string, projectId?: string | null) => Promise<string | null>;
  sendTyping: () => void;
  sendStopTyping: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Initial demo professionals for zero-delay offline fallback
const FALLBACK_PROFESSIONALS: Professional[] = [];

const INITIAL_DEMO_CONVERSATION: Conversation = {
  _id: 'conv_demo_01',
  participants: [
    {
      _id: '65e011111111111111111101',
      id: '65e011111111111111111101',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    {
      _id: '65e011111111111111111102',
      id: '65e011111111111111111102',
      name: 'Arjun Thomas',
      email: 'arjun@floorplan3d.com',
      role: 'professional',
      specialization: 'Architect',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
    }
  ],
  lastMessage: 'Sure. I can help you design a suitable layout.',
  lastMessageAt: '2026-09-17T09:30:00.000Z',
  unreadCount: 0
};

const INITIAL_DEMO_MESSAGES: Message[] = [
  {
    _id: 'msg_01',
    conversationId: 'conv_demo_01',
    senderId: '65e011111111111111111101',
    message: 'I need a 3 bedroom house plan.',
    messageType: 'text',
    readStatus: true,
    createdAt: '2026-09-17T09:20:00.000Z'
  },
  {
    _id: 'msg_02',
    conversationId: 'conv_demo_01',
    senderId: '65e011111111111111111102',
    message: 'Sure. I can help you design a suitable layout.',
    messageType: 'text',
    readStatus: true,
    createdAt: '2026-09-17T09:22:00.000Z'
  },
  {
    _id: 'msg_03',
    conversationId: 'conv_demo_01',
    senderId: '65e011111111111111111101',
    message: 'Here is my initial concept draft for the Modern Villa. Could you check the entrance placement and balcony flow?',
    messageType: 'project_share',
    sharedProject: {
      id: 'demo_villa_01',
      name: 'Modern Villa',
      houseType: 'Villa',
      plotWidth: 50,
      plotLength: 60,
      unit: 'feet',
      roomsCount: 9,
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
    },
    readStatus: true,
    createdAt: '2026-09-17T09:25:00.000Z'
  }
];

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTypingUser, setActiveTypingUser] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize Socket.IO connection whenever user logs in
  useEffect(() => {
    if (user) {
      initSocket();
    }
  }, [user]);

  // Load professionals
  const loadProfessionals = useCallback(async (search?: string, specialization?: string) => {
    try {
      const res = await api.getProfessionals({ search, specialization });
      setProfessionals(res?.professionals || []);
    } catch (err) {
      console.warn('Error loading professionals list:', err);
    }
  }, []);

  // Load chat requests
  const loadChatRequests = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getChatRequests();
      if (res?.requests) {
        setChatRequests(res.requests);
      }
    } catch (err) {
      console.warn('Error loading chat requests:', err);
    }
  }, [user]);

  // Select a conversation and load messages
  const selectConversation = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;

      if (activeConversation?._id && String(activeConversation._id) !== String(conversationId)) {
        socketService.leaveConversation(activeConversation._id);
      }

      setIsLoading(true);
      try {
        let conv = conversations.find(c => String(c._id) === String(conversationId)) || null;

        if (!conv) {
          try {
            const singleRes = await api.getConversationById(conversationId);
            if (singleRes?.conversation) {
              conv = singleRes.conversation;
              setConversations(prev => {
                if (prev.some(c => String(c._id) === String(conversationId))) return prev;
                return [conv!, ...prev];
              });
            }
          } catch (e) {
            const allRes = await api.getConversations();
            if (allRes?.conversations) {
              setConversations(allRes.conversations);
              conv = allRes.conversations.find(c => String(c._id) === String(conversationId)) || null;
            }
          }
        }

        setActiveConversation(conv);
        socketService.joinConversation(conversationId);

        const res = await api.getMessages(conversationId);
        if (res?.messages) {
          setMessages(res.messages);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.warn('Error selecting conversation:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversation, conversations]
  );

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getConversations();
      const fetchedConvs = res?.conversations || [];
      setConversations(fetchedConvs);

      if (fetchedConvs.length > 0) {
        setActiveConversation(currentActive => {
          const exists = currentActive && fetchedConvs.some(c => String(c._id) === String(currentActive._id));
          if (!exists) {
            const firstConv = fetchedConvs[0];
            api.getMessages(firstConv._id).then(msgRes => {
              if (msgRes?.messages) setMessages(msgRes.messages);
            }).catch(console.warn);
            return firstConv;
          }
          return currentActive;
        });
      } else {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.warn('Error loading conversations:', err);
    }
  }, [user]);

  // Fetch initial data on mount or when user changes
  useEffect(() => {
    loadProfessionals();
    if (user) {
      loadChatRequests();
      loadConversations();
    }
  }, [user, loadProfessionals, loadChatRequests, loadConversations]);

  // Listen to real-time socket events
  useEffect(() => {
    if (!user) return;

    const unsubMsg = socketService.onReceiveMessage((newMsg: Message) => {
      if (activeConversation && String(newMsg.conversationId) === String(activeConversation._id)) {
        setMessages(prev => {
          if (prev.some(m => String(m._id) === String(newMsg._id))) return prev;
          return [...prev, newMsg];
        });
      }

      setConversations(prev =>
        prev.map(c => {
          if (String(c._id) === String(newMsg.conversationId)) {
            return {
              ...c,
              lastMessage: newMsg.message || '',
              lastMessageAt: newMsg.createdAt
            };
          }
          return c;
        })
      );
    });

    const unsubTyping = socketService.onTyping(({ conversationId, userId, userName }) => {
      if (activeConversation && String(conversationId) === String(activeConversation._id)) {
        if (user && String(userId) !== String(user.id || (user as any)._id)) {
          setActiveTypingUser(userName || 'Typing...');
        }
      }
    });

    const unsubStopTyping = socketService.onStopTyping(({ conversationId }) => {
      if (activeConversation && String(conversationId) === String(activeConversation._id)) {
        setActiveTypingUser(null);
      }
    });

    const unsubNewReq = socketService.onNewChatRequest((req) => {
      setChatRequests(prev => [req, ...prev]);
    });

    const unsubReqUpdated = socketService.onChatRequestUpdated(() => {
      loadChatRequests();
      loadConversations();
    });

    const unsubOnline = socketService.onUserOnlineStatus(({ userId, status }) => {
      setOnlineUserIds(prev => {
        if (status === 'online') {
          return Array.from(new Set([...prev, userId]));
        } else {
          return prev.filter(id => id !== userId);
        }
      });
    });

    const unsubNewNotif = socketService.onNewMessageNotification(({ conversationId, message }) => {
      loadConversations();
      if (activeConversation && String(conversationId) === String(activeConversation._id)) {
        setMessages(prev => {
          if (prev.some(m => String(m._id) === String(message._id))) return prev;
          return [...prev, message];
        });
      }
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubStopTyping();
      unsubNewReq();
      unsubReqUpdated();
      unsubNewNotif();
      unsubOnline();
    };
  }, [user, activeConversation, loadChatRequests, loadConversations]);

  // Send a chat request
  const sendChatRequest = async (
    receiverId: string,
    message?: string,
    projectId?: string | null,
    projectSnapshot?: ProjectSnapshot | null
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.sendChatRequest({
        receiverId,
        message,
        projectId,
        projectSnapshot
      });
      if (res?.request) {
        setChatRequests(prev => [res.request, ...prev]);
      }
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // Accept a chat request
  const acceptChatRequest = async (requestId: string): Promise<string | null> => {
    try {
      const res = await api.acceptChatRequest(requestId);
      await loadChatRequests();
      await loadConversations();
      return res.conversationId || null;
    } catch (err) {
      console.error('Failed to accept chat request:', err);
      return null;
    }
  };

  // Reject a chat request
  const rejectChatRequest = async (requestId: string): Promise<boolean> => {
    try {
      await api.rejectChatRequest(requestId);
      await loadChatRequests();
      return true;
    } catch (err) {
      console.error('Failed to reject chat request:', err);
      return false;
    }
  };

  // Send message in active conversation
  const sendMessage = async (text: string) => {
    if (!activeConversation || !text.trim()) return;
    const currentUid = user?.id || user?._id || '65e011111111111111111101';
    const myIds = [
      String(user?.id || ''),
      String((user as any)?._id || ''),
      String((user as any)?.professionalId || '')
    ].filter(Boolean);

    let receiverId: string | undefined = undefined;
    if (activeConversation?.participants) {
      const partnerObj = activeConversation.participants.find(p => {
        const pId = String(typeof p === 'object' ? (p._id || (p as any).id) : p);
        return !myIds.includes(pId);
      });
      if (partnerObj) {
        receiverId = String(typeof partnerObj === 'object' ? (partnerObj._id || (partnerObj as any).id) : partnerObj);
      }
    }
    
    // Create optimistic local message
    const tempId = 'msg_' + Date.now();
    const userMsg: Message = {
      _id: tempId,
      conversationId: activeConversation._id,
      senderId: currentUid,
      receiverId,
      message: text.trim(),
      messageType: 'text',
      readStatus: true,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setConversations(prev =>
      prev.map(c =>
        c._id === activeConversation._id
          ? { ...c, lastMessage: text.trim(), lastMessageAt: new Date().toISOString() }
          : c
      )
    );

    try {
      const res = await api.sendMessage(activeConversation._id, text.trim(), 'text', null, receiverId);
      if (res?.message) {
        setMessages(prev =>
          prev.map(m => (m._id === tempId ? res.message : m))
        );
      }
    } catch (err) {
      console.warn('Error sending message:', err);
    }
  };

  // Get or direct-create conversation with a specific professional/user
  const getOrCreateConversation = async (receiverId: string, projectId?: string | null): Promise<string | null> => {
    try {
      const res = await api.createConversation(receiverId, projectId);
      if (res?.conversation) {
        const conv = res.conversation;
        setConversations(prev => {
          if (prev.some(c => String(c._id) === String(conv._id))) {
            return prev.map(c => (String(c._id) === String(conv._id) ? conv : c));
          }
          return [conv, ...prev];
        });
        await selectConversation(conv._id);
        return conv._id;
      }
    } catch (err) {
      console.error('Failed to get or create conversation:', err);
    }
    return null;
  };

  // Share a 3D floor plan in active conversation
  const shareProject = async (project: Project, note?: string) => {
    if (!activeConversation) return;
    const currentUid = user?.id || user?._id || '65e011111111111111111101';

    const shareMsg: Message = {
      _id: 'msg_share_' + Date.now(),
      conversationId: activeConversation._id,
      senderId: currentUid,
      message: note || `Shared 3D floor plan: ${project.name}`,
      messageType: 'project_share',
      sharedProject: {
        id: project.id,
        name: project.name,
        houseType: project.houseType,
        plotWidth: project.plotWidth,
        plotLength: project.plotLength,
        unit: project.unit,
        roomsCount: project.rooms.length,
        thumbnail: project.thumbnail
      },
      readStatus: true,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, shareMsg]);
    try {
      await api.shareProjectInConversation(activeConversation._id, project, note);
    } catch (err) {
      // Local fallback already present
    }
  };

  const sendTyping = () => {
    if (activeConversation) {
      socketService.sendTyping(activeConversation._id);
    }
  };

  const sendStopTyping = () => {
    if (activeConversation) {
      socketService.sendStopTyping(activeConversation._id);
    }
  };

  // Pending requests badge count (requests sent to me that are pending)
  const currentUserId = user?.id || user?._id;
  const pendingRequestsCount = chatRequests.filter(
    r => {
      const recId = typeof r.receiverId === 'object' ? (r.receiverId as User)._id || (r.receiverId as User).id : r.receiverId;
      return String(recId) === String(currentUserId) && r.status === 'pending';
    }
  ).length;

  const unreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <ChatContext.Provider
      value={{
        professionals,
        selectedProfessional,
        chatRequests,
        conversations,
        activeConversation,
        messages,
        activeTypingUser,
        unreadCount,
        pendingRequestsCount,
        onlineUserIds,
        isLoading,

        setSelectedProfessional,
        loadProfessionals,
        loadChatRequests,
        loadConversations,
        selectConversation,
        sendChatRequest,
        acceptChatRequest,
        rejectChatRequest,
        sendMessage,
        shareProject,
        getOrCreateConversation,
        sendTyping,
        sendStopTyping
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

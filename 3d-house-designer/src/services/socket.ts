import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';
import { Message, ProjectSnapshot } from '../types/floorplan';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = getAuthToken();
  const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to real-time engine with id:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection warning:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const socketService = {
  joinConversation(conversationId: string): void {
    const s = getSocket();
    if (s && conversationId) {
      s.emit('joinConversation', { conversationId });
    }
  },

  leaveConversation(conversationId: string): void {
    const s = getSocket();
    if (s && conversationId) {
      s.emit('leaveConversation', { conversationId });
    }
  },

  sendMessage(
    conversationId: string,
    message: string,
    messageType: 'text' | 'project_share' = 'text',
    sharedProject?: ProjectSnapshot | null
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const s = getSocket();
      if (!s) return reject(new Error('Socket not connected'));
      s.emit(
        'sendMessage',
        { conversationId, message, messageType, sharedProject },
        (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response?.message);
          }
        }
      );
    });
  },

  sendTyping(conversationId: string): void {
    const s = getSocket();
    if (s && conversationId) {
      s.emit('typing', { conversationId });
    }
  },

  sendStopTyping(conversationId: string): void {
    const s = getSocket();
    if (s && conversationId) {
      s.emit('stopTyping', { conversationId });
    }
  },

  markMessageRead(messageId: string, conversationId: string): void {
    const s = getSocket();
    if (s && messageId) {
      s.emit('messageRead', { messageId, conversationId });
    }
  },

  onReceiveMessage(callback: (message: Message) => void): () => void {
    const s = getSocket();
    if (!s) return () => {};
    s.on('receiveMessage', callback);
    return () => {
      s.off('receiveMessage', callback);
    };
  },

  onTyping(callback: (data: { conversationId: string; userId: string; userName: string }) => void): () => void {
    const s = getSocket();
    if (!s) return () => {};
    s.on('typing', callback);
    return () => {
      s.off('typing', callback);
    };
  },

  onStopTyping(callback: (data: { conversationId: string; userId: string }) => void): () => void {
    const s = getSocket();
    if (!s) return () => {};
    s.on('stopTyping', callback);
    return () => {
      s.off('stopTyping', callback);
    };
  },

  onNewChatRequest(callback: (request: any) => void): () => void {
    const s = getSocket();
    if (!s) return () => {};
    s.on('newChatRequest', callback);
    return () => {
      s.off('newChatRequest', callback);
    };
  },

  onChatRequestUpdated(callback: (data: { requestId: string; status: string; conversationId?: string }) => void): () => void {
    const s = getSocket();
    if (!s) return () => {};
    s.on('chatRequestUpdated', callback);
    return () => {
      s.off('chatRequestUpdated', callback);
    };
  },

  onNewMessageNotification(callback: (data: { conversationId: string; sender: any; message: Message }) => void): () => void {
    const s = getSocket();
    if (!s) return () => {};
    s.on('newMessageNotification', callback);
    return () => {
      s.off('newMessageNotification', callback);
    };
  },

  onUserOnlineStatus(callback: (data: { userId: string; status: 'online' | 'offline' }) => void): () => void {
    const s = getSocket();
    if (!s) return () => {};
    s.on('userOnlineStatus', callback);
    return () => {
      s.off('userOnlineStatus', callback);
    };
  }
};

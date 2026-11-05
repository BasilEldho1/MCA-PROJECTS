import jwt from 'jsonwebtoken';
import { db } from '../services/dataStore.js';

let ioInstance = null;
// Maps userId -> Set of socket IDs
const userSockets = new Map();

export const initSocket = (io) => {
  ioInstance = io;

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token required for Socket.IO'));
      }

      const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_floorplan3d_2026_dev';
      const decoded = jwt.verify(token, secret);

      const user = await db.findUserById(decoded.id);
      if (!user) {
        return next(new Error('User not found for socket token'));
      }

      socket.user = {
        id: String(user._id || user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      };
      next();
    } catch (err) {
      console.warn('Socket authentication failed:', err.message);
      next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', async (socket) => {
    const rawUserId = socket.user.id;
    const canonicalUserId = await db.resolveCanonicalUserId(rawUserId);
    const pro = await db.getProfessionalById(rawUserId);
    const proId = pro ? String(pro._id || pro.id) : null;

    console.log(`[Socket] User connected: ${socket.user.name} (${canonicalUserId}${proId ? ` / pro: ${proId}` : ''}) - socket: ${socket.id}`);

    // Register socket under canonical ID, raw user ID, and pro ID
    const registeredIds = new Set([String(rawUserId), String(canonicalUserId)]);
    if (proId) registeredIds.add(String(proId));

    for (const id of registeredIds) {
      if (!userSockets.has(id)) {
        userSockets.set(id, new Set());
      }
      userSockets.get(id).add(socket.id);
      socket.join(`user:${id}`);
    }

    // Broadcast online status to active conversations
    io.emit('userOnlineStatus', { userId: canonicalUserId, status: 'online' });
    if (proId) {
      io.emit('userOnlineStatus', { userId: proId, status: 'online' });
    }

    // Join Conversation Room
    socket.on('joinConversation', async ({ conversationId }) => {
      try {
        if (!conversationId) return;
        const conv = await db.findConversationById(conversationId);
        if (!conv) return;

        const isParticipant = (await Promise.all(
          conv.participants.map(async p => {
            const id = typeof p === 'object' ? p._id : p;
            const cId = await db.resolveCanonicalUserId(id);
            return String(cId) === String(canonicalUserId);
          })
        )).some(Boolean);

        if (isParticipant) {
          socket.join(`conversation:${conversationId}`);
          console.log(`[Socket] User ${socket.user.name} joined conversation room: ${conversationId}`);
        } else {
          console.warn(`[Socket] Unauthorized join attempt by ${socket.user.name} for conversation: ${conversationId}`);
        }
      } catch (err) {
        console.error('[Socket] Error in joinConversation:', err);
      }
    });

    // Leave Conversation Room
    socket.on('leaveConversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Send Real-Time Message
    socket.on('sendMessage', async ({ conversationId, message, messageType = 'text', sharedProject = null, receiverId: explicitReceiverId }, callback) => {
      try {
        if (!conversationId || !message || !message.trim()) {
          if (callback) callback({ error: 'Message cannot be empty.' });
          return;
        }

        const conv = await db.findConversationById(conversationId);
        if (!conv) {
          if (callback) callback({ error: 'Conversation not found.' });
          return;
        }

        const isParticipant = (await Promise.all(
          conv.participants.map(async p => {
            const id = typeof p === 'object' ? p._id : p;
            const cId = await db.resolveCanonicalUserId(id);
            return String(cId) === String(canonicalUserId);
          })
        )).some(Boolean);

        if (!isParticipant) {
          if (callback) callback({ error: 'Not authorized for this conversation.' });
          return;
        }

        // Determine target recipient canonically
        let targetReceiverId = null;
        if (explicitReceiverId) {
          const explicitCanonical = await db.resolveCanonicalUserId(explicitReceiverId);
          for (const p of conv.participants) {
            const pId = typeof p === 'object' ? p._id : p;
            const pCanonical = await db.resolveCanonicalUserId(pId);
            if (String(pCanonical) === String(explicitCanonical) && String(pCanonical) !== String(canonicalUserId)) {
              targetReceiverId = pCanonical;
              break;
            }
          }
        }

        if (!targetReceiverId) {
          for (const p of conv.participants) {
            const pId = typeof p === 'object' ? p._id : p;
            const pCanonical = await db.resolveCanonicalUserId(pId);
            if (String(pCanonical) !== String(canonicalUserId)) {
              targetReceiverId = pCanonical;
              break;
            }
          }
        }

        if (!targetReceiverId) {
          if (callback) callback({ error: 'Unable to determine valid recipient.' });
          return;
        }

        // Access Control: check if communicating with an unapproved professional
        const proReceiver = await db.getProfessionalById(targetReceiverId);
        if (proReceiver) {
          const isApproved =
            proReceiver.verification?.status === 'APPROVED' || proReceiver.verificationStatus === 'verified';
          if (!isApproved) {
            if (callback) callback({ error: 'This professional account is not approved to receive consultation messages.' });
            return;
          }
        }

        // Access Control: check paid chat session validity
        await db.updateExpiredSessions();
        const session = await db.getChatSessionForConversation(conversationId);
        if (session) {
          const isSessionActive =
            session.sessionStatus === 'ACTIVE' && new Date(session.endTime) > new Date();
          if (!isSessionActive) {
            if (callback) {
              callback({
                error: 'Paid chat session has ended. Please start a new session to continue chatting.',
                sessionExpired: true
              });
            }
            return;
          }
        }

        const savedMessage = await db.createMessage({
          conversationId,
          senderId: canonicalUserId,
          receiverId: targetReceiverId,
          message: message.trim(),
          messageType,
          sharedProject
        });

        await db.updateConversationLastMessage(conversationId, message.trim());

        // Broadcast to everyone in conversation room
        io.to(`conversation:${conversationId}`).emit('receiveMessage', savedMessage);

        // Also notify recipient directly
        emitToUser(targetReceiverId, 'newMessageNotification', {
          conversationId,
          sender: {
            _id: canonicalUserId,
            name: socket.user.name,
            avatar: socket.user.avatar,
            role: socket.user.role
          },
          message: savedMessage
        });

        if (callback) callback({ success: true, message: savedMessage });
      } catch (err) {
        console.error('[Socket] Error in sendMessage:', err);
        if (callback) callback({ error: 'Failed to send message: ' + err.message });
      }
    });

    // Typing Indicators
    socket.on('typing', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('typing', {
          conversationId,
          userId: canonicalUserId,
          userName: socket.user.name
        });
      }
    });

    socket.on('stopTyping', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('stopTyping', {
          conversationId,
          userId: canonicalUserId
        });
      }
    });

    // Message Read Receipts
    socket.on('messageRead', async ({ messageId, conversationId }) => {
      try {
        if (messageId) {
          await db.markMessageAsRead(messageId);
          io.to(`conversation:${conversationId}`).emit('messageRead', {
            messageId,
            conversationId,
            readBy: canonicalUserId
          });
        }
      } catch (err) {
        console.error('[Socket] Error in messageRead:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user.name} (${canonicalUserId})`);
      for (const id of registeredIds) {
        const userSocketsSet = userSockets.get(id);
        if (userSocketsSet) {
          userSocketsSet.delete(socket.id);
          if (userSocketsSet.size === 0) {
            userSockets.delete(id);
            io.emit('userOnlineStatus', { userId: id, status: 'offline' });
          }
        }
      }
    });
  });
};

export const emitToUser = async (userId, event, data) => {
  if (!ioInstance || !userId) return;
  try {
    const canonicalId = await db.resolveCanonicalUserId(userId);
    const targetIds = new Set([String(userId), String(canonicalId)]);

    const pro = await db.getProfessionalById(canonicalId);
    if (pro && (pro._id || pro.id)) {
      targetIds.add(String(pro._id || pro.id));
    }

    for (const tid of targetIds) {
      ioInstance.to(`user:${tid}`).emit(event, data);
    }
  } catch (e) {
    console.error('Error emitting to user:', e);
  }
};

export const emitToConversation = (conversationId, event, data) => {
  if (!ioInstance) return;
  ioInstance.to(`conversation:${conversationId}`).emit(event, data);
};

export const isUserOnline = (userId) => {
  return userSockets.has(String(userId)) && userSockets.get(String(userId)).size > 0;
};

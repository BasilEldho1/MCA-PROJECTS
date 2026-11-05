import express from 'express';
import { db } from '../services/dataStore.js';
import { authenticateJWT } from '../middleware/auth.js';
import { emitToConversation, emitToUser } from '../socket/socketHandler.js';

const router = express.Router();

// GET /api/conversations/:id/messages - Fetch all messages for conversation
router.get('/:id/messages', authenticateJWT, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await db.findConversationById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const senderCanonical = await db.resolveCanonicalUserId(req.user.id);
    const isParticipant = (await Promise.all(
      conversation.participants.map(async p => {
        const id = typeof p === 'object' ? p._id : p;
        const cId = await db.resolveCanonicalUserId(id);
        return String(cId) === String(senderCanonical);
      })
    )).some(Boolean);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden: You cannot access messages in this conversation.' });
    }

    // Mark messages sent to this user as read
    await db.markAllMessagesInConversationAsRead(conversationId, senderCanonical);

    const messages = await db.getMessages(conversationId);
    res.json({ messages });
  } catch (err) {
    console.error('Error getting messages:', err);
    res.status(500).json({ error: 'Failed to retrieve messages: ' + err.message });
  }
});

// POST /api/conversations/:id/messages - Send a new message
router.post('/:id/messages', authenticateJWT, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { message, messageType = 'text', sharedProject, receiverId: explicitReceiverId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message exceeds the 2000-character limit.' });
    }

    const conversation = await db.findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const senderCanonical = await db.resolveCanonicalUserId(req.user.id);

    // Verify sender is authorized participant
    const isParticipant = (await Promise.all(
      conversation.participants.map(async p => {
        const id = typeof p === 'object' ? p._id : p;
        const cId = await db.resolveCanonicalUserId(id);
        return String(cId) === String(senderCanonical);
      })
    )).some(Boolean);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Forbidden: You are not a participant in this conversation.' });
    }

    // Determine target recipient canonically
    let targetReceiverId = null;
    if (explicitReceiverId) {
      const explicitCanonical = await db.resolveCanonicalUserId(explicitReceiverId);
      for (const p of conversation.participants) {
        const pId = typeof p === 'object' ? p._id : p;
        const pCanonical = await db.resolveCanonicalUserId(pId);
        if (String(pCanonical) === String(explicitCanonical) && String(pCanonical) !== String(senderCanonical)) {
          targetReceiverId = pCanonical;
          break;
        }
      }
    }

    if (!targetReceiverId) {
      for (const p of conversation.participants) {
        const pId = typeof p === 'object' ? p._id : p;
        const pCanonical = await db.resolveCanonicalUserId(pId);
        if (String(pCanonical) !== String(senderCanonical)) {
          targetReceiverId = pCanonical;
          break;
        }
      }
    }

    if (!targetReceiverId) {
      return res.status(400).json({ error: 'Unable to determine valid recipient for this conversation.' });
    }

    // Access Control: check if communicating with a professional
    const proReceiver = await db.getProfessionalById(targetReceiverId);
    if (proReceiver) {
      const isApproved =
        proReceiver.verification?.status === 'APPROVED' || proReceiver.verificationStatus === 'verified';
      if (!isApproved) {
        return res.status(403).json({
          error: 'This professional account is not approved to receive consultation messages.'
        });
      }
    }

    // Access Control: check paid chat session validity
    await db.updateExpiredSessions();
    const session = await db.getChatSessionForConversation(conversationId);
    if (session) {
      const isSessionActive =
        session.sessionStatus === 'ACTIVE' && new Date(session.endTime) > new Date();
      if (!isSessionActive) {
        return res.status(403).json({
          error: 'Paid chat session has ended. Please start a new session to continue chatting.',
          sessionExpired: true,
          sessionId: session._id
        });
      }
    }

    const savedMessage = await db.createMessage({
      conversationId,
      senderId: senderCanonical,
      receiverId: targetReceiverId,
      message: message.trim(),
      messageType,
      sharedProject: sharedProject || null
    });

    await db.updateConversationLastMessage(conversationId, message.trim());

    // Broadcast to conversation room via Socket.IO
    emitToConversation(conversationId, 'receiveMessage', savedMessage);

    // Also emit direct notification strictly to intended receiver
    const notifPayload = {
      conversationId,
      sender: {
        _id: senderCanonical,
        name: req.user.name,
        avatar: req.user.avatar,
        role: req.user.role
      },
      message: savedMessage
    };
    emitToUser(targetReceiverId, 'newMessageNotification', notifPayload);

    res.status(201).json({ message: savedMessage });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message: ' + err.message });
  }
});

// PUT /api/messages/:id/read - Mark message as read
router.put('/messages/:id/read', authenticateJWT, async (req, res) => {
  try {
    const updated = await db.markMessageAsRead(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ message: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

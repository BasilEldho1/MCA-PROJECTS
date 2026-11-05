import express from 'express';
import { db } from '../services/dataStore.js';
import { authenticateJWT } from '../middleware/auth.js';
import { emitToConversation } from '../socket/socketHandler.js';

const router = express.Router();

// GET /api/conversations - Get all conversations for current user
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const conversations = await db.findConversationsForUser(req.user.id);
    res.json({ conversations });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Failed to retrieve conversations: ' + err.message });
  }
});

// GET /api/conversations/:id - Get conversation details with authorization check
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const conversation = await db.findConversationById(req.params.id);
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
      return res.status(403).json({ error: 'Forbidden: You are not a participant in this conversation.' });
    }

    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/conversations - Direct creation / retrieval of conversation
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { receiverId, projectId } = req.body;
    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required.' });
    }

    const senderCanonical = await db.resolveCanonicalUserId(req.user.id);
    const receiverCanonical = await db.resolveCanonicalUserId(receiverId);

    if (!receiverCanonical) {
      return res.status(404).json({ error: 'Recipient not found.' });
    }

    if (String(senderCanonical) === String(receiverCanonical)) {
      return res.status(400).json({ error: 'Cannot create a conversation with yourself.' });
    }

    let existing = await db.findConversationBetween(senderCanonical, receiverCanonical);
    if (existing) {
      return res.json({ conversation: existing });
    }

    const newConv = await db.createConversation({
      participants: [senderCanonical, receiverCanonical],
      projectId: projectId || null,
      lastMessage: 'Conversation initiated'
    });

    res.status(201).json({ conversation: newConv });
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/conversations/:id/share-project - Share a floor plan project in conversation
router.post('/:id/share-project', authenticateJWT, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { project, note } = req.body;

    if (!project || !project.name) {
      return res.status(400).json({ error: 'Valid floor plan project object is required.' });
    }

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
      return res.status(403).json({ error: 'Forbidden: Not a participant.' });
    }

    // Determine other participant (receiver) canonically
    let receiverId = null;
    for (const p of conversation.participants) {
      const id = typeof p === 'object' ? p._id : p;
      const cId = await db.resolveCanonicalUserId(id);
      if (String(cId) !== String(senderCanonical)) {
        receiverId = cId;
        break;
      }
    }

    if (!receiverId) {
      return res.status(400).json({ error: 'Cannot determine recipient in conversation.' });
    }

    // Save project in backend data store so it can be viewed by the other participant
    await db.saveProject(project, senderCanonical);

    // Create the project share message
    const messageText = note || `Shared floor plan project: "${project.name}"`;
    const message = await db.createMessage({
      conversationId,
      senderId: senderCanonical,
      receiverId,
      message: messageText,
      messageType: 'project_share',
      sharedProject: {
        id: project.id,
        name: project.name,
        houseType: project.houseType,
        plotWidth: project.plotWidth,
        plotLength: project.plotLength,
        unit: project.unit,
        floorsCount: project.floorsCount || 1,
        thumbnail: project.thumbnail || '',
        walls: project.walls || [],
        rooms: project.rooms || [],
        doors: project.doors || [],
        windows: project.windows || [],
        furniture: project.furniture || []
      }
    });

    await db.updateConversationLastMessage(conversationId, `Floor Plan: ${project.name}`);

    // Emit real-time message to socket room
    emitToConversation(conversationId, 'receiveMessage', message);

    res.status(201).json({
      message: 'Project shared successfully.',
      chatMessage: message
    });
  } catch (err) {
    console.error('Error sharing project in conversation:', err);
    res.status(500).json({ error: 'Failed to share project: ' + err.message });
  }
});

export default router;

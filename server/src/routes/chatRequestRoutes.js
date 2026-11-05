import express from 'express';
import { db } from '../services/dataStore.js';
import { authenticateJWT } from '../middleware/auth.js';
import { emitToUser } from '../socket/socketHandler.js';

const router = express.Router();

// POST /api/chat-requests - Send a new chat request
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { receiverId, message, projectId, projectSnapshot } = req.body;
    const senderId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required.' });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ error: 'You cannot send a chat request to yourself.' });
    }

    // Gate: Unverified professionals cannot receive chat requests & resolve to User ID
    const proReceiver = await db.getProfessionalById(receiverId);
    let targetReceiverUserId = receiverId;
    if (proReceiver) {
      const isApproved = (proReceiver.verification?.status === 'APPROVED') || (proReceiver.verificationStatus === 'verified');
      if (!isApproved) {
        return res.status(403).json({
          error: 'This professional is currently undergoing license verification and cannot receive new consultation requests at this time.'
        });
      }
      if (proReceiver.userId) {
        targetReceiverUserId = String(proReceiver.userId);
      }
    }

    if (String(senderId) === String(targetReceiverUserId)) {
      return res.status(400).json({ error: 'You cannot send a chat request to yourself.' });
    }

    // Check if there is already a pending request between this user and pro
    const existingPending = await db.findExistingPendingRequest(senderId, targetReceiverUserId);
    if (existingPending) {
      return res.status(409).json({
        error: 'A pending chat request already exists with this professional. Please wait for their response.',
        request: existingPending
      });
    }

    // Also check if they already have an active conversation
    const existingConv = await db.findConversationBetween(senderId, targetReceiverUserId);
    if (existingConv) {
      return res.status(200).json({
        message: 'You already have an active conversation with this professional.',
        conversationId: existingConv._id,
        conversation: existingConv
      });
    }

    const request = await db.createChatRequest({
      senderId,
      receiverId: targetReceiverUserId,
      message: message || 'Hello, I would like to consult with you on my floor plan project.',
      projectId: projectId || null,
      projectSnapshot: projectSnapshot || null
    });

    // Populate sender info for real-time notification
    const populatedRequest = {
      ...request,
      senderId: {
        _id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        role: req.user.role
      }
    };

    // Emit real-time socket event to receiver (both User ID and Pro Document ID)
    emitToUser(targetReceiverUserId, 'newChatRequest', populatedRequest);
    if (receiverId !== targetReceiverUserId) {
      emitToUser(receiverId, 'newChatRequest', populatedRequest);
    }

    res.status(201).json({
      message: 'Chat request submitted successfully.',
      request: populatedRequest
    });
  } catch (err) {
    console.error('Error creating chat request:', err);
    res.status(500).json({ error: 'Failed to send chat request: ' + err.message });
  }
});

// GET /api/chat-requests - Get all requests for current user
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const requests = await db.findChatRequestsForUser(req.user.id);
    res.json({ requests });
  } catch (err) {
    console.error('Error retrieving chat requests:', err);
    res.status(500).json({ error: 'Failed to retrieve chat requests: ' + err.message });
  }
});

// PUT /api/chat-requests/:id/accept - Professional accepts request
router.put('/:id/accept', authenticateJWT, async (req, res) => {
  try {
    const requestId = req.params.id;
    const allRequests = await db.findChatRequestsForUser(req.user.id);
    const targetRequest = allRequests.find(r => String(r._id) === String(requestId));

    if (!targetRequest) {
      return res.status(404).json({ error: 'Chat request not found or unauthorized.' });
    }

    // Verify current user is recipient (support both User ID and Pro Document ID)
    const receiverIdStr = String(typeof targetRequest.receiverId === 'object' ? targetRequest.receiverId._id : targetRequest.receiverId);
    const proProfile = await db.getProfessionalById(req.user.id);
    const validRecipientIds = [
      String(req.user.id),
      proProfile ? String(proProfile._id) : null,
      proProfile ? String(proProfile.userId) : null
    ].filter(Boolean);

    if (!validRecipientIds.includes(receiverIdStr)) {
      return res.status(403).json({ error: 'Only the requested recipient can accept this request.' });
    }

    const senderIdStr = String(typeof targetRequest.senderId === 'object' ? targetRequest.senderId._id : targetRequest.senderId);

    // Update status to accepted
    const updatedRequest = await db.updateChatRequestStatus(requestId, 'accepted');

    // Create or retrieve conversation
    let conversation = await db.findConversationBetween(senderIdStr, req.user.id);
    if (!conversation) {
      conversation = await db.createConversation({
        participants: [senderIdStr, req.user.id],
        projectId: targetRequest.projectId || null,
        lastMessage: `Chat request accepted. Consultation started.`
      });

      // If there was an attached project or initial note, create the opening message
      if (targetRequest.projectSnapshot) {
        await db.createMessage({
          conversationId: conversation._id,
          senderId: senderIdStr,
          receiverId: req.user.id,
          message: targetRequest.message || 'Shared floor plan for consultation',
          messageType: 'project_share',
          sharedProject: targetRequest.projectSnapshot
        });
      } else if (targetRequest.message) {
        await db.createMessage({
          conversationId: conversation._id,
          senderId: senderIdStr,
          receiverId: req.user.id,
          message: targetRequest.message,
          messageType: 'text'
        });
      }
    }

    // Emit real-time notification to user that request was accepted
    emitToUser(senderIdStr, 'chatRequestUpdated', {
      requestId,
      status: 'accepted',
      conversationId: conversation._id
    });

    res.json({
      message: 'Chat request accepted.',
      request: updatedRequest,
      conversationId: conversation._id,
      conversation
    });
  } catch (err) {
    console.error('Error accepting chat request:', err);
    res.status(500).json({ error: 'Failed to accept request: ' + err.message });
  }
});

// PUT /api/chat-requests/:id/reject - Reject request
router.put('/:id/reject', authenticateJWT, async (req, res) => {
  try {
    const requestId = req.params.id;
    const allRequests = await db.findChatRequestsForUser(req.user.id);
    const targetRequest = allRequests.find(r => String(r._id) === String(requestId));

    if (!targetRequest) {
      return res.status(404).json({ error: 'Chat request not found or unauthorized.' });
    }

    const receiverIdStr = String(typeof targetRequest.receiverId === 'object' ? targetRequest.receiverId._id : targetRequest.receiverId);
    if (receiverIdStr !== String(req.user.id)) {
      return res.status(403).json({ error: 'Only the requested recipient can reject this request.' });
    }

    const senderIdStr = String(typeof targetRequest.senderId === 'object' ? targetRequest.senderId._id : targetRequest.senderId);
    const updatedRequest = await db.updateChatRequestStatus(requestId, 'rejected');

    emitToUser(senderIdStr, 'chatRequestUpdated', {
      requestId,
      status: 'rejected'
    });

    res.json({
      message: 'Chat request declined.',
      request: updatedRequest
    });
  } catch (err) {
    console.error('Error rejecting chat request:', err);
    res.status(500).json({ error: 'Failed to reject request: ' + err.message });
  }
});

export default router;

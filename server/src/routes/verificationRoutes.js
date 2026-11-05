import express from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../services/dataStore.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { documentUpload, UPLOAD_DOCUMENTS_DIR } from '../middleware/documentUpload.js';

const router = express.Router();

/**
 * Helper to process uploaded file or base64 file representation
 */
export const saveBase64Document = (base64String, filename, prefix = 'doc') => {
  if (!base64String || typeof base64String !== 'string') return null;
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;

  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const ext = mimeType === 'application/pdf' ? '.pdf' : mimeType.includes('png') ? '.png' : '.jpg';
  const cleanBase = (filename || 'document').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const storedFilename = `${prefix}-${cleanBase}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(UPLOAD_DOCUMENTS_DIR, storedFilename);

  fs.writeFileSync(filePath, buffer);

  return {
    filename: storedFilename,
    originalName: filename || `document${ext}`,
    path: `uploads/documents/${storedFilename}`,
    mimeType,
    size: buffer.length,
    uploadedAt: new Date()
  };
};

// ==========================================
// PROFESSIONAL VERIFICATION ENDPOINTS
// ==========================================

/**
 * GET /api/professionals/verification/status
 * Get the current professional's verification status
 */
router.get('/professionals/verification/status', authenticateJWT, async (req, res) => {
  try {
    const pro = await db.getProfessionalById(req.user.id);
    if (!pro) {
      return res.status(404).json({ error: 'Professional profile not found.' });
    }

    const history = await db.getVerificationHistory(pro._id);

    return res.json({
      professionalId: pro._id,
      name: pro.name,
      specialization: pro.specialization,
      licenseNumber: pro.licenseNumber,
      companyName: pro.companyName,
      status: pro.verification?.status || (pro.verificationStatus === 'verified' ? 'APPROVED' : 'PENDING'),
      verification: pro.verification || {
        status: pro.verificationStatus === 'verified' ? 'APPROVED' : 'PENDING',
        rejectionReason: '',
        submittedAt: pro.createdAt
      },
      licenseDocument: pro.licenseDocument ? {
        originalName: pro.licenseDocument.originalName,
        size: pro.licenseDocument.size,
        mimeType: pro.licenseDocument.mimeType,
        uploadedAt: pro.licenseDocument.uploadedAt,
        hasDocument: !!pro.licenseDocument.filename
      } : null,
      qualificationDocument: pro.qualificationDocument ? {
        originalName: pro.qualificationDocument.originalName,
        size: pro.qualificationDocument.size,
        mimeType: pro.qualificationDocument.mimeType,
        uploadedAt: pro.qualificationDocument.uploadedAt,
        hasDocument: !!pro.qualificationDocument.filename
      } : null,
      history
    });
  } catch (err) {
    console.error('Error fetching verification status:', err);
    return res.status(500).json({ error: 'Failed to fetch verification status.' });
  }
});

/**
 * POST /api/professionals/verification/resubmit
 * Resubmit verification documents and update details after rejection
 */
router.post(
  '/professionals/verification/resubmit',
  authenticateJWT,
  documentUpload.fields([
    { name: 'licenseDocument', maxCount: 1 },
    { name: 'qualificationDocument', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const pro = await db.getProfessionalById(req.user.id);
      if (!pro) {
        return res.status(404).json({ error: 'Professional profile not found.' });
      }

      const updates = {};
      const {
        name,
        phone,
        companyName,
        licenseNumber,
        specialization,
        yearsOfExperience,
        experience,
        portfolioWebsite,
        description,
        location,
        resubmissionNotes,
        licenseDocumentBase64,
        licenseDocumentName,
        qualificationDocumentBase64,
        qualificationDocumentName
      } = req.body;

      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (companyName) updates.companyName = companyName;
      if (licenseNumber) updates.licenseNumber = licenseNumber;
      if (specialization) updates.specialization = specialization;
      if (yearsOfExperience) updates.yearsOfExperience = Number(yearsOfExperience);
      if (experience) updates.experience = experience;
      if (portfolioWebsite) updates.portfolioWebsite = portfolioWebsite;
      if (description) updates.description = description;
      if (location) updates.location = location;
      if (resubmissionNotes) updates.resubmissionNotes = resubmissionNotes;

      // Handle file uploads from multipart/form-data
      if (req.files?.licenseDocument?.[0]) {
        const file = req.files.licenseDocument[0];
        updates.licenseDocument = {
          filename: file.filename,
          originalName: file.originalname,
          path: `uploads/documents/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date()
        };
      } else if (licenseDocumentBase64) {
        // Base64 upload fallback
        const doc = saveBase64Document(licenseDocumentBase64, licenseDocumentName, 'license');
        if (doc) updates.licenseDocument = doc;
      }

      if (req.files?.qualificationDocument?.[0]) {
        const file = req.files.qualificationDocument[0];
        updates.qualificationDocument = {
          filename: file.filename,
          originalName: file.originalname,
          path: `uploads/documents/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date()
        };
      } else if (qualificationDocumentBase64) {
        const doc = saveBase64Document(qualificationDocumentBase64, qualificationDocumentName, 'qual');
        if (doc) updates.qualificationDocument = doc;
      }

      const updated = await db.resubmitProfessionalVerification(pro._id, updates);

      return res.json({
        message: 'Verification request resubmitted successfully. It is now pending admin review.',
        professional: updated
      });
    } catch (err) {
      console.error('Error resubmitting verification:', err);
      return res.status(500).json({ error: err.message || 'Failed to resubmit verification.' });
    }
  }
);

/**
 * GET /api/professionals/:id/document/:docType
 * Secure file retrieval: strictly role/ownership gated!
 * Only Admin or Document Owner can view/download.
 * Normal users or guests receive 403 Forbidden.
 */
router.get('/professionals/:id/document/:docType', authenticateJWT, async (req, res) => {
  try {
    const { id, docType } = req.params;
    const pro = await db.getProfessionalById(id);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found.' });
    }

    // Role & Ownership check
    const isOwner = String(pro.userId) === String(req.user.id) || String(pro._id) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to access this document.' });
    }

    const doc = docType === 'license' ? pro.licenseDocument : pro.qualificationDocument;
    if (!doc || !doc.filename) {
      return res.status(404).json({ error: 'Requested document not found.' });
    }

    const fullFilePath = path.resolve(UPLOAD_DOCUMENTS_DIR, doc.filename);

    if (!fs.existsSync(fullFilePath)) {
      // If demo seed file or missing on disk, provide fallback or generate dummy sample
      if (doc.filename.startsWith('demo_') || doc.filename.includes('license') || doc.filename.includes('degree')) {
        res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${doc.originalName || 'license.pdf'}"`);
        res.setHeader('Cache-Control', 'private, no-cache');
        return res.send(Buffer.from(`%PDF-1.4\n% Demo Verification Document for ${pro.name}\n% License Number: ${pro.licenseNumber}\n% Status: VERIFIED\n%%EOF`));
      }
      return res.status(404).json({ error: 'Document file not found on server.' });
    }

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName || doc.filename}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    return res.sendFile(fullFilePath);
  } catch (err) {
    console.error('Error retrieving document:', err);
    return res.status(500).json({ error: 'Failed to retrieve document.' });
  }
});

// ==========================================
// ADMIN VERIFICATION MANAGEMENT ENDPOINTS
// ==========================================

/**
 * GET /api/admin/professionals/verification-requests
 * Admin-only: list verification requests with tabs (pending, approved, rejected, all), search, sort
 */
router.get('/admin/professionals/verification-requests', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { status = 'ALL', search = '', sort = 'newest' } = req.query;
    const result = await db.getVerificationRequests({ status, search, sort });
    return res.json(result);
  } catch (err) {
    console.error('Error fetching admin verification requests:', err);
    return res.status(500).json({ error: 'Failed to fetch verification requests.' });
  }
});

/**
 * GET /api/admin/professionals/:id
 * Admin-only: get full professional details and user account info
 */
router.get('/admin/professionals/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const pro = await db.getProfessionalById(req.params.id);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found.' });
    }

    const user = await db.findUserById(pro.userId);
    const history = await db.getVerificationHistory(pro._id);

    return res.json({
      professional: pro,
      user: user ? {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt
      } : null,
      history
    });
  } catch (err) {
    console.error('Error fetching professional details for admin:', err);
    return res.status(500).json({ error: 'Failed to fetch professional details.' });
  }
});

/**
 * PATCH /api/admin/professionals/:id/approve
 * Admin-only: approve a professional's license verification
 */
router.patch('/admin/professionals/:id/approve', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    const adminId = req.user.id;
    const adminName = req.user.name || 'System Admin';

    const updated = await db.approveProfessional(req.params.id, adminId, adminName, notes);
    return res.json({
      message: `Professional ${updated.name} has been verified and approved successfully.`,
      professional: updated
    });
  } catch (err) {
    console.error('Error approving professional:', err);
    return res.status(500).json({ error: err.message || 'Failed to approve professional.' });
  }
});

/**
 * PATCH /api/admin/professionals/:id/reject
 * Admin-only: reject a professional's license verification with mandatory reason
 */
router.patch('/admin/professionals/:id/reject', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { reason, notes } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is mandatory.' });
    }

    const adminId = req.user.id;
    const adminName = req.user.name || 'System Admin';

    const updated = await db.rejectProfessional(req.params.id, adminId, adminName, reason, notes);
    return res.json({
      message: `Professional ${updated.name}'s verification request has been rejected.`,
      professional: updated
    });
  } catch (err) {
    console.error('Error rejecting professional:', err);
    return res.status(500).json({ error: err.message || 'Failed to reject professional.' });
  }
});

/**
 * GET /api/admin/professionals/:id/history
 * Admin (or self) verification audit timeline
 */
router.get('/admin/professionals/:id/history', authenticateJWT, async (req, res) => {
  try {
    const pro = await db.getProfessionalById(req.params.id);
    if (!pro) {
      return res.status(404).json({ error: 'Professional not found.' });
    }

    const isOwner = String(pro.userId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const history = await db.getVerificationHistory(pro._id);
    return res.json({ history });
  } catch (err) {
    console.error('Error fetching verification history:', err);
    return res.status(500).json({ error: 'Failed to fetch verification history.' });
  }
});

// ==========================================
// NOTIFICATIONS ENDPOINTS
// ==========================================

/**
 * GET /api/notifications
 * Fetch notifications for current user or admin
 */
router.get('/notifications', authenticateJWT, async (req, res) => {
  try {
    const notifications = await db.getNotificationsForUser(req.user.id, req.user.role);
    return res.json({ notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/notifications/:id/read', authenticateJWT, async (req, res) => {
  try {
    const updated = await db.markNotificationAsRead(req.params.id);
    return res.json({ success: true, notification: updated });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/notifications/read-all', authenticateJWT, async (req, res) => {
  try {
    await db.markAllNotificationsAsRead(req.user.id, req.user.role);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    return res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

export default router;

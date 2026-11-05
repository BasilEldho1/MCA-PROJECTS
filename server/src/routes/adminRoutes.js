import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../services/dataStore.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Enforce admin privileges on all /api/admin routes
router.use(authenticateJWT, requireRole('admin'));

// ==========================================
// 1. USER MANAGEMENT ENDPOINTS
// ==========================================

/**
 * GET /api/admin/users
 * Search and filter users by role and search query
 */
router.get('/users', async (req, res) => {
  try {
    const { search = '', role = '', sort = 'newest' } = req.query;
    const result = await db.getAllUsers({ search, role, sort });
    return res.json({
      success: true,
      users: result.users,
      total: result.total,
      counts: result.counts
    });
  } catch (err) {
    console.error('[Admin] Error fetching users:', err);
    return res.status(500).json({ error: 'Failed to fetch users: ' + err.message });
  }
});

/**
 * POST /api/admin/users
 * Admin creates a user directly
 */
router.post('/users', async (req, res) => {
  try {
    const {
      name,
      email,
      password = 'password123',
      role = 'user',
      phone = '',
      username = '',
      specialization = '',
      companyName = '',
      licenseNumber = '',
      yearsOfExperience = 0,
      location = '',
      bio = ''
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email address already exists.' });
    }

    const newUser = await db.createUser({
      name: name.trim(),
      username: username ? username.trim() : cleanEmail.split('@')[0],
      email: cleanEmail,
      password,
      role,
      phone,
      specialization,
      companyName,
      licenseNumber,
      yearsOfExperience: Number(yearsOfExperience) || 0,
      location,
      bio
    });

    // If created as professional, initialize a corresponding professional document
    let proProfile = null;
    if (role === 'professional') {
      proProfile = await db.createProfessionalProfile({
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        specialization: specialization || 'Architect',
        companyName: companyName || '',
        licenseNumber: licenseNumber || 'ADMIN-GEN-' + Math.floor(Math.random() * 8999 + 1000),
        yearsOfExperience: Number(yearsOfExperience) || 3,
        location: location || '',
        description: bio || 'Professional architect and designer profile.',
        verificationStatus: 'verified',
        verification: {
          status: 'APPROVED',
          rejectionReason: '',
          submittedAt: new Date(),
          reviewedAt: new Date(),
          reviewedBy: req.user.id
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: `User ${newUser.name} created successfully.`,
      user: newUser,
      professional: proProfile
    });
  } catch (err) {
    console.error('[Admin] Error creating user:', err);
    return res.status(500).json({ error: 'Failed to create user: ' + err.message });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user details and role
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, username, specialization, companyName, licenseNumber, location, bio } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (role) updates.role = role;
    if (phone !== undefined) updates.phone = phone.trim();
    if (username !== undefined) updates.username = username.trim().toLowerCase();
    if (specialization !== undefined) updates.specialization = specialization;
    if (companyName !== undefined) updates.companyName = companyName;
    if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber;
    if (location !== undefined) updates.location = location;
    if (bio !== undefined) updates.bio = bio;

    const updated = await db.updateUser(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Sync professional profile if exists
    if (updates.name || updates.specialization || updates.companyName || updates.location) {
      const pro = await db.getProfessionalById(id);
      if (pro) {
        await db.updateProfessional(pro._id, {
          name: updates.name || pro.name,
          specialization: updates.specialization || pro.specialization,
          companyName: updates.companyName !== undefined ? updates.companyName : pro.companyName,
          location: updates.location !== undefined ? updates.location : pro.location
        });
      }
    }

    return res.json({
      success: true,
      message: 'User updated successfully.',
      user: updated
    });
  } catch (err) {
    console.error('[Admin] Error updating user:', err);
    return res.status(500).json({ error: 'Failed to update user: ' + err.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user account and linked resources
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ error: 'Administrators cannot delete their own active account.' });
    }
    await db.deleteUser(id);
    return res.json({
      success: true,
      message: 'User account and associated records deleted.'
    });
  } catch (err) {
    console.error('[Admin] Error deleting user:', err);
    return res.status(500).json({ error: 'Failed to delete user: ' + err.message });
  }
});

// ==========================================
// 2. PROFESSIONAL MANAGEMENT ENDPOINTS
// ==========================================

/**
 * GET /api/admin/professionals
 * List all professionals with verification details
 */
router.get('/professionals', async (req, res) => {
  try {
    const { search = '', specialization = '', status = 'ALL' } = req.query;
    const pros = await db.getProfessionals({
      search,
      specialization,
      status,
      includeUnverified: true
    });

    const allPros = await db.getProfessionals({ includeUnverified: true, status: 'ALL' });
    const counts = {
      total: allPros.length,
      verified: allPros.filter(p => (p.verification?.status === 'APPROVED' || p.verificationStatus === 'verified')).length,
      pending: allPros.filter(p => (p.verification?.status === 'PENDING' || p.verificationStatus === 'pending')).length,
      rejected: allPros.filter(p => (p.verification?.status === 'REJECTED')).length
    };

    return res.json({
      success: true,
      professionals: pros,
      total: pros.length,
      counts
    });
  } catch (err) {
    console.error('[Admin] Error fetching professionals:', err);
    return res.status(500).json({ error: 'Failed to fetch professionals: ' + err.message });
  }
});

/**
 * POST /api/admin/professionals
 * Create a new professional profile directly from admin
 */
router.post('/professionals', async (req, res) => {
  try {
    const {
      name,
      email,
      specialization = 'Architect',
      companyName = '',
      licenseNumber = '',
      phone = '',
      hourlyRate = '$95/hr',
      rating = 5.0,
      location = '',
      experience = '5+ years',
      description = '',
      status = 'APPROVED'
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Professional name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await db.findUserByEmail(cleanEmail);
    if (!user) {
      user = await db.createUser({
        name: name.trim(),
        email: cleanEmail,
        password: 'password123',
        role: 'professional',
        phone,
        specialization,
        companyName,
        licenseNumber,
        location,
        bio: description
      });
    }

    const pro = await db.createProfessionalProfile({
      userId: user._id,
      name: name.trim(),
      email: cleanEmail,
      phone,
      specialization,
      companyName,
      licenseNumber: licenseNumber || `LIC-${Date.now().toString().slice(-6)}`,
      hourlyRate,
      rating: Number(rating) || 4.9,
      location,
      experience,
      description: description || 'Certified professional architect & designer.',
      verificationStatus: status === 'APPROVED' ? 'verified' : (status === 'REJECTED' ? 'unverified' : 'pending'),
      verification: {
        status,
        rejectionReason: '',
        submittedAt: new Date(),
        reviewedAt: status === 'APPROVED' ? new Date() : undefined,
        reviewedBy: status === 'APPROVED' ? req.user.id : undefined
      }
    });

    return res.status(201).json({
      success: true,
      message: `Professional profile for ${pro.name} created successfully.`,
      professional: pro
    });
  } catch (err) {
    console.error('[Admin] Error creating professional:', err);
    return res.status(500).json({ error: 'Failed to create professional: ' + err.message });
  }
});

/**
 * PUT /api/admin/professionals/:id
 * Edit professional profile
 */
router.put('/professionals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await db.updateProfessional(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Professional not found.' });
    }
    return res.json({
      success: true,
      message: 'Professional profile updated successfully.',
      professional: updated
    });
  } catch (err) {
    console.error('[Admin] Error updating professional:', err);
    return res.status(500).json({ error: 'Failed to update professional: ' + err.message });
  }
});

/**
 * PATCH /api/admin/professionals/:id/status
 * Direct status modification (APPROVED, PENDING, REJECTED)
 */
router.patch('/professionals/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason = '', notes = '' } = req.body;

    if (!['APPROVED', 'PENDING', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status: ' + status });
    }

    if (status === 'APPROVED') {
      const updated = await db.approveProfessional(id, req.user.id, req.user.name, notes);
      return res.json({ success: true, message: 'Professional approved successfully.', professional: updated });
    } else if (status === 'REJECTED') {
      const updated = await db.rejectProfessional(id, req.user.id, req.user.name, rejectionReason, notes);
      return res.json({ success: true, message: 'Professional rejected.', professional: updated });
    } else {
      const updated = await db.updateProfessional(id, {
        verificationStatus: 'pending',
        verification: { status: 'PENDING', rejectionReason: '', submittedAt: new Date() }
      });
      return res.json({ success: true, message: 'Professional reset to pending status.', professional: updated });
    }
  } catch (err) {
    console.error('[Admin] Error setting professional status:', err);
    return res.status(500).json({ error: 'Failed to change status: ' + err.message });
  }
});

/**
 * DELETE /api/admin/professionals/:id
 * Delete professional profile
 */
router.delete('/professionals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteProfessional(id);
    return res.json({
      success: true,
      message: 'Professional record deleted successfully.'
    });
  } catch (err) {
    console.error('[Admin] Error deleting professional:', err);
    return res.status(500).json({ error: 'Failed to delete professional: ' + err.message });
  }
});

// ==========================================
// 3. DATABASE MANAGEMENT & METRICS ENDPOINTS
// ==========================================

/**
 * GET /api/admin/database/stats
 * Real-time stats on database connectivity and collection documents
 */
router.get('/database/stats', async (req, res) => {
  try {
    const stats = await db.getDatabaseStats();
    return res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('[Admin] Error retrieving database stats:', err);
    return res.status(500).json({ error: 'Failed to retrieve database stats: ' + err.message });
  }
});

/**
 * POST /api/admin/database/seed
 * Seed sample data into database
 */
router.post('/database/seed', async (req, res) => {
  try {
    const result = await db.seedFullDatabase();
    const stats = await db.getDatabaseStats();
    return res.json({
      success: true,
      message: result.message,
      stats
    });
  } catch (err) {
    console.error('[Admin] Error seeding database:', err);
    return res.status(500).json({ error: 'Database seed operation failed: ' + err.message });
  }
});

/**
 * POST /api/admin/database/reset
 * Reset database and restore default records
 */
router.post('/database/reset', async (req, res) => {
  try {
    const result = await db.resetDatabase();
    const stats = await db.getDatabaseStats();
    return res.json({
      success: true,
      message: result.message,
      stats
    });
  } catch (err) {
    console.error('[Admin] Error resetting database:', err);
    return res.status(500).json({ error: 'Database reset operation failed: ' + err.message });
  }
});

/**
 * GET /api/admin/database/export
 * Export all collections as JSON backup
 */
router.get('/database/export', async (req, res) => {
  try {
    const data = await db.exportDatabase();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="database-export-${Date.now()}.json"`);
    return res.json(data);
  } catch (err) {
    console.error('[Admin] Error exporting database:', err);
    return res.status(500).json({ error: 'Database export failed: ' + err.message });
  }
});

export default router;

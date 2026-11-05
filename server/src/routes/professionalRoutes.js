import express from 'express';
import { db } from '../services/dataStore.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/professionals - List and search professionals
router.get('/', async (req, res) => {
  try {
    const { search = '', specialization = '', status, includeUnverified } = req.query;
    const professionals = await db.getProfessionals({
      search,
      specialization,
      status,
      includeUnverified: includeUnverified !== 'false'
    });
    res.json({ professionals });
  } catch (err) {
    console.error('Error fetching professionals:', err);
    res.status(500).json({ error: 'Failed to retrieve professionals. ' + err.message });
  }
});

// GET /api/professionals/:id - Get specific professional details
router.get('/:id', async (req, res) => {
  try {
    const pro = await db.getProfessionalById(req.params.id);
    if (!pro) {
      return res.status(404).json({ error: 'Professional profile not found.' });
    }
    res.json({ professional: pro });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/professionals/profile - Update own professional profile
router.put('/profile', authenticateJWT, requireRole('professional', 'admin'), async (req, res) => {
  try {
    const {
      specialization,
      experience,
      description,
      availability,
      hourlyRate,
      skills,
      location
    } = req.body;

    const updated = await db.updateProfessionalProfile(req.user.id, {
      ...(specialization && { specialization }),
      ...(experience && { experience }),
      ...(description !== undefined && { description }),
      ...(availability && { availability }),
      ...(hourlyRate && { hourlyRate }),
      ...(skills && { skills }),
      ...(location && { location })
    });

    // Also sync user record specialization
    if (specialization) {
      await db.updateUser(req.user.id, { specialization });
    }

    res.json({ professional: updated });
  } catch (err) {
    console.error('Error updating professional profile:', err);
    res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

export default router;

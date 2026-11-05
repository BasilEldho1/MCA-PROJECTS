import express from 'express';
import { db } from '../services/dataStore.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// GET /api/projects - List projects for current user
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const projects = await db.getProjectsForUser(req.user.id);
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id - Retrieve project data for viewing/inspection
router.get('/:id', async (req, res) => {
  try {
    const project = await db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects - Save/sync a project to server
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const projectData = req.body;
    if (!projectData || !projectData.name) {
      return res.status(400).json({ error: 'Project data and name are required.' });
    }

    const saved = await db.saveProject(projectData, req.user.id);
    res.json({ project: saved, message: 'Project saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id - Update existing project
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const projectData = { ...req.body, projectId: req.params.id };
    const saved = await db.saveProject(projectData, req.user.id);
    res.json({ project: saved, message: 'Project updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/rename - Rename project
router.post('/:id/rename', authenticateJWT, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'New name is required' });
    const updated = await db.renameProject(req.params.id, name, req.user.id);
    res.json({ project: updated, message: 'Project renamed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/clone - Clone project (Save As)
router.post('/:id/clone', authenticateJWT, async (req, res) => {
  try {
    const { name } = req.body;
    const cloned = await db.cloneProject(req.params.id, name, req.user.id);
    res.json({ project: cloned, message: 'Project duplicated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const result = await db.deleteProject(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/share - Share project with professional
router.post('/:id/share', authenticateJWT, async (req, res) => {
  try {
    const { professionalId, files = [], format = 'pdf', message = '', allowEdit = false } = req.body;
    if (!professionalId) {
      return res.status(400).json({ error: 'Target professional ID is required.' });
    }

    const result = await db.shareProjectWithProfessional(req.params.id, req.user.id, {
      professionalId,
      files,
      format,
      message,
      allowEdit
    });

    res.json(result);
  } catch (err) {
    console.error('Error sharing project:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;

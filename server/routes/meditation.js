import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { getAIResponse } from '../utils/ai.js';

const router = Router();

// GET /api/meditation
router.get('/', async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    let query = 'SELECT * FROM meditation_sessions';
    const params = [];
    const conditions = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (difficulty) {
      params.push(difficulty);
      conditions.push(`difficulty = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get meditations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/meditation/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meditation_sessions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meditation session not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get meditation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/meditation
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, duration_minutes, category, difficulty, audio_url, image_url, instructions } = req.body;
    if (!title || !duration_minutes) {
      return res.status(400).json({ error: 'Title and duration are required' });
    }
    const result = await pool.query(
      'INSERT INTO meditation_sessions (title, description, duration_minutes, category, difficulty, audio_url, image_url, instructions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, description, duration_minutes, category, difficulty, audio_url, image_url, instructions]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create meditation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/meditation/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, duration_minutes, category, difficulty, audio_url, image_url, instructions } = req.body;
    const result = await pool.query(
      `UPDATE meditation_sessions SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        duration_minutes = COALESCE($3, duration_minutes),
        category = COALESCE($4, category),
        difficulty = COALESCE($5, difficulty),
        audio_url = COALESCE($6, audio_url),
        image_url = COALESCE($7, image_url),
        instructions = COALESCE($8, instructions)
      WHERE id = $9 RETURNING *`,
      [title, description, duration_minutes, category, difficulty, audio_url, image_url, instructions, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meditation session not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update meditation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/meditation/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM meditation_sessions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meditation session not found' });
    }
    res.json({ message: 'Meditation session deleted' });
  } catch (error) {
    console.error('Delete meditation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/meditation/generate - AI generates a guided meditation script
router.post('/generate', auth, async (req, res) => {
  try {
    const { duration, focus, mood, experience_level } = req.body;

    const analysis = await getAIResponse(
      'You are a calming, experienced meditation guide. Create a guided meditation script that the user can follow. Include: an opening (settling in, body awareness), the main practice (visualization, breath work, or body scan as appropriate), and a gentle closing. Use calming, present-tense language with natural pauses indicated by "..." Write in second person ("you"). The script should feel like being guided by a warm, trusted teacher.',
      `Duration: ${duration || 10} minutes\nFocus: ${focus || 'general relaxation'}\nCurrent mood: ${mood || 'not specified'}\nExperience level: ${experience_level || 'beginner'}`
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Meditation generation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

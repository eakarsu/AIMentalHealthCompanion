import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { getAIResponse } from '../utils/ai.js';

const router = Router();

// GET /api/selfcare
router.get('/', async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    let query = 'SELECT * FROM self_care_activities';
    const params = [];
    const conditions = [];
    if (category) { params.push(category); conditions.push(`category = $${params.length}`); }
    if (difficulty) { params.push(difficulty); conditions.push(`difficulty = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get self-care activities error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/selfcare/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM self_care_activities WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Activity not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/selfcare
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, duration_minutes, difficulty, benefits, image_url } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'INSERT INTO self_care_activities (title, description, category, duration_minutes, difficulty, benefits, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, description, category, duration_minutes, difficulty, benefits, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/selfcare/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, category, duration_minutes, difficulty, benefits, image_url } = req.body;
    const result = await pool.query(
      `UPDATE self_care_activities SET
        title=COALESCE($1,title), description=COALESCE($2,description), category=COALESCE($3,category),
        duration_minutes=COALESCE($4,duration_minutes), difficulty=COALESCE($5,difficulty),
        benefits=COALESCE($6,benefits), image_url=COALESCE($7,image_url)
      WHERE id=$8 RETURNING *`,
      [title, description, category, duration_minutes, difficulty, benefits, image_url, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Activity not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/selfcare/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM self_care_activities WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Activity not found' });
    res.json({ message: 'Activity deleted' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/selfcare/recommend - AI personalized self-care recommendations
router.post('/recommend', auth, async (req, res) => {
  try {
    const { mood, energy_level, available_time, concerns } = req.body;
    const activitiesResult = await pool.query('SELECT title, category, duration_minutes, difficulty FROM self_care_activities LIMIT 20');

    const analysis = await getAIResponse(
      'You are a compassionate self-care advisor. Based on the user\'s current state, recommend 3-5 personalized self-care activities. For each recommendation, explain why it would help right now. If the user mentioned specific concerns, address them directly. Be warm and encouraging. Format as a numbered list with brief explanations.',
      `Current mood: ${mood || 'not specified'}\nEnergy level: ${energy_level || 'not specified'}\nAvailable time: ${available_time || 'not specified'} minutes\nCurrent concerns: ${concerns || 'none specified'}\n\nAvailable activities in library:\n${activitiesResult.rows.map(a => `- ${a.title} (${a.category}, ${a.duration_minutes}min, ${a.difficulty})`).join('\n')}`
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Self-care recommendation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

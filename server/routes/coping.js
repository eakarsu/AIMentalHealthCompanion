import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { getAIResponse } from '../utils/ai.js';

const router = Router();

// GET /api/coping
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM coping_strategies';
    const params = [];
    if (category) { params.push(category); query += ' WHERE category = $1'; }
    query += ' ORDER BY effectiveness_rating DESC, created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get coping strategies error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/coping/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coping_strategies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Coping strategy not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get coping strategy error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/coping
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, situation, effectiveness_rating, steps } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'INSERT INTO coping_strategies (title, description, category, situation, effectiveness_rating, steps) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title, description, category, situation, effectiveness_rating, steps ? JSON.stringify(steps) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create coping strategy error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/coping/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, category, situation, effectiveness_rating, steps } = req.body;
    const result = await pool.query(
      `UPDATE coping_strategies SET
        title=COALESCE($1,title), description=COALESCE($2,description), category=COALESCE($3,category),
        situation=COALESCE($4,situation), effectiveness_rating=COALESCE($5,effectiveness_rating),
        steps=COALESCE($6,steps)
      WHERE id=$7 RETURNING *`,
      [title, description, category, situation, effectiveness_rating, steps ? JSON.stringify(steps) : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Coping strategy not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update coping strategy error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/coping/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM coping_strategies WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Coping strategy not found' });
    res.json({ message: 'Coping strategy deleted' });
  } catch (error) {
    console.error('Delete coping strategy error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/coping/suggest - AI suggests coping strategies for a situation
router.post('/suggest', auth, async (req, res) => {
  try {
    const { situation, current_mood, intensity } = req.body;
    const strategiesResult = await pool.query('SELECT title, category, situation, effectiveness_rating FROM coping_strategies ORDER BY effectiveness_rating DESC LIMIT 20');

    const analysis = await getAIResponse(
      'You are a compassionate mental health coping strategist. Based on the user\'s current situation, suggest 3-5 evidence-based coping strategies. For each strategy: name it, explain the technique step by step, and explain why it helps for this specific situation. Include a mix of immediate relief techniques and longer-term strategies. Be warm and practical. Do not diagnose.',
      `Current situation: ${situation || 'general stress'}\nCurrent mood: ${current_mood || 'not specified'}\nIntensity: ${intensity || 5}/10\n\nExisting strategies in their toolkit:\n${strategiesResult.rows.map(s => `- ${s.title} (${s.category}, effectiveness: ${s.effectiveness_rating}/10, for: ${s.situation || 'general'})`).join('\n')}`
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Coping suggestion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

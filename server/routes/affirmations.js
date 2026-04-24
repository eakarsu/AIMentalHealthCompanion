import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { getAIResponse } from '../utils/ai.js';

const router = Router();

// GET /api/affirmations/random
router.get('/random', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM affirmations';
    const params = [];
    if (category) { params.push(category); query += ' WHERE category = $1'; }
    query += ' ORDER BY RANDOM() LIMIT 1';
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No affirmations found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get random affirmation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/affirmations
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM affirmations';
    const params = [];
    if (category) { params.push(category); query += ' WHERE category = $1'; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get affirmations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/affirmations/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM affirmations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Affirmation not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get affirmation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/affirmations
router.post('/', auth, async (req, res) => {
  try {
    const { text, category, author, is_favorite } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const result = await pool.query(
      'INSERT INTO affirmations (text, category, author, is_favorite) VALUES ($1,$2,$3,$4) RETURNING *',
      [text, category, author, is_favorite || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create affirmation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/affirmations/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { text, category, author, is_favorite } = req.body;
    const result = await pool.query(
      `UPDATE affirmations SET
        text=COALESCE($1,text), category=COALESCE($2,category),
        author=COALESCE($3,author), is_favorite=COALESCE($4,is_favorite)
      WHERE id=$5 RETURNING *`,
      [text, category, author, is_favorite, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Affirmation not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update affirmation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/affirmations/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM affirmations WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Affirmation not found' });
    res.json({ message: 'Affirmation deleted' });
  } catch (error) {
    console.error('Delete affirmation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/affirmations/generate - AI generates personalized affirmations
router.post('/generate', auth, async (req, res) => {
  try {
    const { focus_area, current_challenge, preferred_tone } = req.body;

    const analysis = await getAIResponse(
      'You are a compassionate positive psychology expert specializing in affirmations. Generate 5 personalized, powerful affirmations based on what the user needs right now. Each affirmation should be: present tense, positive, personal, and emotionally resonant. After the affirmations, briefly explain the psychology behind why these specific affirmations will help. Format each affirmation on its own line, starting with a number.',
      `Focus area: ${focus_area || 'general well-being'}\nCurrent challenge: ${current_challenge || 'none specified'}\nPreferred tone: ${preferred_tone || 'warm and empowering'}`
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Affirmation generation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

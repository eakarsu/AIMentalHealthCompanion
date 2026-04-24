import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { getAIResponse } from '../utils/ai.js';

const router = Router();

// GET /api/gratitude
router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM gratitude_entries WHERE user_id = $1';
    const params = [req.user.id];
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get gratitude entries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/gratitude/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM gratitude_entries WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gratitude entry not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get gratitude entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/gratitude
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, entry_text, category, intensity } = req.body;
    const text = content || entry_text;
    if (!text) return res.status(400).json({ error: 'Content is required' });
    const result = await pool.query(
      'INSERT INTO gratitude_entries (user_id, title, entry_text, category, intensity) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, title || null, text, category || 'personal', intensity || 5]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create gratitude entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/gratitude/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, entry_text, category, intensity } = req.body;
    const text = content || entry_text;
    const result = await pool.query(
      `UPDATE gratitude_entries SET
        title=COALESCE($1,title),
        entry_text=COALESCE($2,entry_text),
        category=COALESCE($3,category),
        intensity=COALESCE($4,intensity)
      WHERE id=$5 AND user_id=$6 RETURNING *`,
      [title, text, category, intensity, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gratitude entry not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update gratitude entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/gratitude/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM gratitude_entries WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gratitude entry not found' });
    res.json({ message: 'Gratitude entry deleted' });
  } catch (error) {
    console.error('Delete gratitude entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/gratitude/:id/analyze - AI insights on a gratitude entry
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM gratitude_entries WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entry not found' });

    const entry = result.rows[0];
    const analysis = await getAIResponse(
      'You are a compassionate gratitude coach and positive psychology expert. Reflect on the user\'s gratitude entry with warmth. Highlight the deeper meaning behind what they are grateful for, connect it to well-being research, and suggest ways to deepen this appreciation in daily life. Keep it concise (3-4 paragraphs). Do not diagnose or provide medical advice.',
      `Title: ${entry.title || 'Untitled'}\nCategory: ${entry.category}\nIntensity: ${entry.intensity}/10\nEntry: ${entry.entry_text}`
    );

    await pool.query('UPDATE gratitude_entries SET ai_analysis = $1 WHERE id = $2', [analysis, req.params.id]);
    res.json({ analysis });
  } catch (error) {
    console.error('Gratitude analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

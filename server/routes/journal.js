import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';

const router = Router();

// GET /api/journal
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/journal/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/journal
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, mood, tags, is_private } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const result = await pool.query(
      'INSERT INTO journal_entries (user_id, title, content, mood, tags, is_private) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, title, content, mood, tags, is_private !== undefined ? is_private : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/journal/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, mood, tags, is_private } = req.body;
    const result = await pool.query(
      `UPDATE journal_entries SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        mood = COALESCE($3, mood),
        tags = COALESCE($4, tags),
        is_private = COALESCE($5, is_private),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND user_id = $7 RETURNING *`,
      [title, content, mood, tags, is_private, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/journal/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json({ message: 'Journal entry deleted', entry: result.rows[0] });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/journal/:id/analyze
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const entryResult = await pool.query(
      'SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    const entry = entryResult.rows[0];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate mental health AI assistant. Analyze the journal entry and provide thoughtful, supportive insights. Identify emotions, themes, cognitive patterns, and suggest gentle reflections. Do not diagnose. Be warm and encouraging.'
          },
          {
            role: 'user',
            content: `Please analyze this journal entry:\n\nTitle: ${entry.title}\nMood: ${entry.mood || 'not specified'}\nContent: ${entry.content}`
          }
        ]
      })
    });

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'Unable to generate analysis at this time.';

    await pool.query(
      'UPDATE journal_entries SET ai_analysis = $1 WHERE id = $2',
      [analysis, req.params.id]
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Journal analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { getAIResponse } from '../utils/ai.js';

const router = Router();

// GET /api/breathing
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM breathing_exercises';
    const params = [];
    if (category) {
      params.push(category);
      query += ' WHERE category = $1';
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get breathing exercises error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/breathing/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM breathing_exercises WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Breathing exercise not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get breathing exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/breathing
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, inhale_seconds, hold_seconds, exhale_seconds, rounds, category, benefits } = req.body;
    if (!title || !inhale_seconds || !exhale_seconds) {
      return res.status(400).json({ error: 'Title, inhale_seconds, and exhale_seconds are required' });
    }
    const result = await pool.query(
      'INSERT INTO breathing_exercises (title, description, inhale_seconds, hold_seconds, exhale_seconds, rounds, category, benefits) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, description, inhale_seconds, hold_seconds || 0, exhale_seconds, rounds || 4, category, benefits]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create breathing exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/breathing/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, inhale_seconds, hold_seconds, exhale_seconds, rounds, category, benefits } = req.body;
    const result = await pool.query(
      `UPDATE breathing_exercises SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        inhale_seconds = COALESCE($3, inhale_seconds),
        hold_seconds = COALESCE($4, hold_seconds),
        exhale_seconds = COALESCE($5, exhale_seconds),
        rounds = COALESCE($6, rounds),
        category = COALESCE($7, category),
        benefits = COALESCE($8, benefits)
      WHERE id = $9 RETURNING *`,
      [title, description, inhale_seconds, hold_seconds, exhale_seconds, rounds, category, benefits, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Breathing exercise not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update breathing exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/breathing/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM breathing_exercises WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Breathing exercise not found' });
    }
    res.json({ message: 'Breathing exercise deleted' });
  } catch (error) {
    console.error('Delete breathing exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/breathing/recommend - AI recommends breathing exercise based on state
router.post('/recommend', auth, async (req, res) => {
  try {
    const { current_feeling, stress_level, goal } = req.body;
    const exercisesResult = await pool.query('SELECT title, description, inhale_seconds, hold_seconds, exhale_seconds, rounds, category FROM breathing_exercises LIMIT 20');

    const analysis = await getAIResponse(
      'You are a calming breathing and relaxation expert. Based on the user\'s current state, recommend the best breathing technique(s) from their library. Explain: 1) Which technique is best for right now and why, 2) How to do it step by step, 3) The science behind why this breathing pattern helps with their specific feeling, 4) Tips for getting the most benefit. Be calm, reassuring, and specific.',
      `Current feeling: ${current_feeling || 'stressed'}\nStress level: ${stress_level || 5}/10\nGoal: ${goal || 'feel calmer'}\n\nAvailable exercises:\n${exercisesResult.rows.map(e => `- ${e.title}: ${e.inhale_seconds}s inhale / ${e.hold_seconds}s hold / ${e.exhale_seconds}s exhale, ${e.rounds} rounds (${e.category || 'general'})`).join('\n')}`
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Breathing recommendation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

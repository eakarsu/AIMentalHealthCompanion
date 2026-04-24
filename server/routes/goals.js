import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { getAIResponse } from '../utils/ai.js';

const router = Router();

// GET /api/goals
router.get('/', auth, async (req, res) => {
  try {
    const { status, category } = req.query;
    let query = 'SELECT * FROM goals WHERE user_id = $1';
    const params = [req.user.id];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/goals/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/goals
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, target_date, milestones } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'INSERT INTO goals (user_id, title, description, category, target_date, milestones) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.id, title, description, category, target_date, milestones ? JSON.stringify(milestones) : '[]']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/goals/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, category, target_date, status, milestones } = req.body;
    const result = await pool.query(
      `UPDATE goals SET
        title=COALESCE($1,title), description=COALESCE($2,description), category=COALESCE($3,category),
        target_date=COALESCE($4,target_date), status=COALESCE($5,status),
        milestones=COALESCE($6,milestones), updated_at=CURRENT_TIMESTAMP
      WHERE id=$7 AND user_id=$8 RETURNING *`,
      [title, description, category, target_date, status, milestones ? JSON.stringify(milestones) : null, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/goals/:id/progress
router.patch('/:id/progress', auth, async (req, res) => {
  try {
    const { progress } = req.body;
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }
    const status = progress >= 100 ? 'completed' : 'active';
    const result = await pool.query(
      'UPDATE goals SET progress=$1, status=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3 AND user_id=$4 RETURNING *',
      [progress, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update goal progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM goals WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/goals/:id/coach - AI coaching for a goal
router.post('/:id/coach', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });

    const goal = result.rows[0];
    const analysis = await getAIResponse(
      'You are a supportive mental health goal coach. Analyze the user\'s goal and provide: 1) Encouragement based on their current progress, 2) 3-5 specific, actionable next steps they can take, 3) Potential obstacles to watch for and how to overcome them, 4) A motivational reflection. Be warm, practical, and specific. Do not diagnose or provide medical advice.',
      `Goal: ${goal.title}\nDescription: ${goal.description || 'None'}\nCategory: ${goal.category}\nProgress: ${goal.progress || 0}%\nStatus: ${goal.status}\nTarget Date: ${goal.target_date || 'Not set'}\nMilestones: ${goal.milestones || '[]'}`
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Goal coaching error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

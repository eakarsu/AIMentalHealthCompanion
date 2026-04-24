import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';

const router = Router();

// GET /api/sleep
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sleep_logs WHERE user_id = $1 ORDER BY sleep_date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get sleep logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/sleep/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sleep_logs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sleep log not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get sleep log error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/sleep
router.post('/', auth, async (req, res) => {
  try {
    const { sleep_date, bedtime, wake_time, duration_hours, quality, notes, factors } = req.body;
    if (!sleep_date) return res.status(400).json({ error: 'sleep_date is required' });
    const result = await pool.query(
      'INSERT INTO sleep_logs (user_id, sleep_date, bedtime, wake_time, duration_hours, quality, notes, factors) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [req.user.id, sleep_date, bedtime, wake_time, duration_hours, quality, notes, factors]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create sleep log error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/sleep/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { sleep_date, bedtime, wake_time, duration_hours, quality, notes, factors } = req.body;
    const result = await pool.query(
      `UPDATE sleep_logs SET
        sleep_date=COALESCE($1,sleep_date), bedtime=COALESCE($2,bedtime), wake_time=COALESCE($3,wake_time),
        duration_hours=COALESCE($4,duration_hours), quality=COALESCE($5,quality),
        notes=COALESCE($6,notes), factors=COALESCE($7,factors)
      WHERE id=$8 AND user_id=$9 RETURNING *`,
      [sleep_date, bedtime, wake_time, duration_hours, quality, notes, factors, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sleep log not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update sleep log error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/sleep/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sleep_logs WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sleep log not found' });
    res.json({ message: 'Sleep log deleted' });
  } catch (error) {
    console.error('Delete sleep log error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/sleep/analyze
router.post('/analyze', auth, async (req, res) => {
  try {
    const sleepResult = await pool.query(
      'SELECT * FROM sleep_logs WHERE user_id = $1 ORDER BY sleep_date DESC LIMIT 30',
      [req.user.id]
    );

    if (sleepResult.rows.length === 0) {
      return res.status(400).json({ error: 'No sleep data to analyze' });
    }

    const sleepSummary = sleepResult.rows.map(s =>
      `Date: ${s.sleep_date}, Bedtime: ${s.bedtime}, Wake: ${s.wake_time}, Duration: ${s.duration_hours}h, Quality: ${s.quality}/10, Notes: ${s.notes || 'none'}, Factors: ${s.factors ? s.factors.join(', ') : 'none'}`
    ).join('\n');

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
            content: 'You are a compassionate sleep health AI assistant. Analyze the user\'s sleep patterns and provide helpful, evidence-based insights. Identify patterns, suggest improvements based on sleep hygiene principles, and be encouraging. Do not diagnose sleep disorders - recommend professional consultation when appropriate.'
          },
          {
            role: 'user',
            content: `Please analyze my recent sleep patterns:\n\n${sleepSummary}`
          }
        ]
      })
    });

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'Unable to generate sleep analysis at this time.';
    res.json({ analysis });
  } catch (error) {
    console.error('Sleep analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

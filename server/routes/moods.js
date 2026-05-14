import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /api/moods
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM moods WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get moods error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/moods/trends - 30-day mood trend analysis
router.get('/trends', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DATE(created_at) as date, AVG(mood_level) as avg_score
       FROM moods
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [req.user.id]
    );

    const daily_averages = result.rows.map(r => ({
      date: r.date,
      avg_score: parseFloat(parseFloat(r.avg_score).toFixed(1))
    }));

    if (daily_averages.length === 0) {
      return res.json({ daily_averages: [], weekly_average: null, trend: 'stable', lowest_day: null, highest_day: null });
    }

    const scores = daily_averages.map(d => d.avg_score);
    const weekly_average = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));

    // Simple trend: compare first half vs second half
    const mid = Math.floor(scores.length / 2);
    const firstHalfAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / (mid || 1);
    const secondHalfAvg = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid || 1);
    let trend = 'stable';
    if (secondHalfAvg - firstHalfAvg > 0.5) trend = 'improving';
    else if (firstHalfAvg - secondHalfAvg > 0.5) trend = 'declining';

    const sortedByScore = [...daily_averages].sort((a, b) => a.avg_score - b.avg_score);
    const lowest_day = sortedByScore[0] || null;
    const highest_day = sortedByScore[sortedByScore.length - 1] || null;

    res.json({ daily_averages, weekly_average, trend, lowest_day, highest_day });
  } catch (error) {
    console.error('Mood trends error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/moods/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM moods WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mood not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get mood error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/moods
router.post('/', auth, async (req, res) => {
  try {
    const { mood_level, mood_label, notes, factors } = req.body;
    if (mood_level == null || mood_level === '') {
      return res.status(400).json({ error: 'mood_level is required' });
    }
    const score = parseInt(mood_level);
    if (isNaN(score) || score < 1 || score > 10) {
      return res.status(400).json({ error: 'mood_level must be a number between 1 and 10' });
    }
    if (!mood_label) {
      return res.status(400).json({ error: 'mood_label is required' });
    }
    const result = await pool.query(
      'INSERT INTO moods (user_id, mood_level, mood_label, notes, factors) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, score, mood_label, notes, factors]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create mood error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/moods/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { mood_level, mood_label, notes, factors } = req.body;
    if (mood_level != null) {
      const score = parseInt(mood_level);
      if (isNaN(score) || score < 1 || score > 10) {
        return res.status(400).json({ error: 'mood_level must be between 1 and 10' });
      }
    }
    const result = await pool.query(
      'UPDATE moods SET mood_level = COALESCE($1, mood_level), mood_label = COALESCE($2, mood_label), notes = COALESCE($3, notes), factors = COALESCE($4, factors) WHERE id = $5 AND user_id = $6 RETURNING *',
      [mood_level, mood_label, notes, factors, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mood not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update mood error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/moods/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM moods WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mood not found' });
    }
    res.json({ message: 'Mood deleted', mood: result.rows[0] });
  } catch (error) {
    console.error('Delete mood error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/moods/:id/analyze
router.post('/:id/analyze', auth, aiLimiter, async (req, res) => {
  try {
    const moodsResult = await pool.query(
      'SELECT * FROM moods WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );

    if (moodsResult.rows.length === 0) {
      return res.status(400).json({ error: 'No mood data to analyze' });
    }

    const moodSummary = moodsResult.rows.map(m =>
      `Date: ${m.created_at}, Level: ${m.mood_level}/10, Label: ${m.mood_label}, Notes: ${m.notes || 'none'}, Factors: ${m.factors ? m.factors.join(', ') : 'none'}`
    ).join('\n');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate mental health AI assistant. Analyze the user\'s mood patterns and provide helpful insights. Be supportive and encouraging.'
          },
          {
            role: 'user',
            content: `Please analyze my recent mood patterns:\n\n${moodSummary}`
          }
        ]
      })
    });

    if (!response.ok) throw new Error('AI service error: ' + response.status);
    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'Unable to generate analysis at this time.';
    res.json({ analysis });
  } catch (error) {
    console.error('Mood analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

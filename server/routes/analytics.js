import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { parseAIJson } from '../utils/ai.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /api/analytics/mood-sleep-correlation
router.get('/mood-sleep-correlation', auth, aiLimiter, async (req, res) => {
  try {
    // Query mood_logs joined with sleep_logs by date for last 30 days
    // Use moods and sleep tables
    const moodResult = await pool.query(
      `SELECT DATE(created_at) as date, AVG(mood_level) as mood_score
       FROM moods
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [req.user.id]
    );

    // Try sleep table (may be sleep_logs or sleep_entries)
    let sleepResult;
    try {
      sleepResult = await pool.query(
        `SELECT DATE(created_at) as date, hours_slept as sleep_hours
         FROM sleep_logs
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
         ORDER BY date ASC`,
        [req.user.id]
      );
    } catch (_) {
      try {
        sleepResult = await pool.query(
          `SELECT DATE(created_at) as date, duration as sleep_hours
           FROM sleep_entries
           WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
           ORDER BY date ASC`,
          [req.user.id]
        );
      } catch (_2) {
        sleepResult = { rows: [] };
      }
    }

    // Merge by date
    const moodMap = {};
    moodResult.rows.forEach(r => { moodMap[r.date] = parseFloat(r.mood_score); });

    const sleepMap = {};
    sleepResult.rows.forEach(r => { sleepMap[r.date] = parseFloat(r.sleep_hours); });

    const allDates = [...new Set([...Object.keys(moodMap), ...Object.keys(sleepMap)])].sort();
    const timeSeries = allDates.map(date => ({
      date,
      mood_score: moodMap[date] ?? null,
      sleep_hours: sleepMap[date] ?? null
    })).filter(d => d.mood_score !== null || d.sleep_hours !== null);

    let aiInsight = null;
    if (timeSeries.length >= 3) {
      try {
        const dataText = timeSeries.map(d =>
          `${d.date}: mood=${d.mood_score ?? 'N/A'}/10, sleep=${d.sleep_hours ?? 'N/A'}h`
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
              { role: 'system', content: 'You are a compassionate mental health data analyst. Return valid JSON only.' },
              { role: 'user', content: `Analyze this user's mood and sleep data. Return JSON: { correlation_strength: 'strong|moderate|weak|none', key_insight, pattern_description, recommendations: [] }\n\nData:\n${dataText}` }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const raw = data.choices?.[0]?.message?.content || '';
          aiInsight = parseAIJson(raw) || { raw };
        }
      } catch (_) {}
    }

    res.json({ time_series: timeSeries, ai_insight: aiInsight });
  } catch (error) {
    console.error('Mood-sleep correlation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

// Streaming mood anomaly detector (rolling z-score).
// MECHANICAL: pure logic — pulls last N mood entries, computes mean & stddev
// of `score` (or `value`), flags any reading outside ±Z stddevs.
// PRODUCT-DECISION: window=14 days, z-threshold=2.0. Override via env
// ANOMALY_WINDOW, ANOMALY_Z.
import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';

const router = Router();

const WINDOW_DAYS = Number(process.env.ANOMALY_WINDOW || '14');
const Z_THRESHOLD = Number(process.env.ANOMALY_Z || '2.0');

router.get('/moods', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const r = await pool
      .query(
        `SELECT id, mood_score, created_at FROM moods WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${WINDOW_DAYS} days' ORDER BY created_at ASC`,
        [userId]
      )
      .catch(() => ({ rows: [] }));
    const points = r.rows.map((row) => ({ id: row.id, score: Number(row.mood_score), at: row.created_at }));
    if (points.length < 4) {
      return res.json({ window_days: WINDOW_DAYS, count: points.length, anomalies: [], note: 'insufficient data' });
    }
    const scores = points.map((p) => p.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
    const stddev = Math.sqrt(variance) || 1;
    const anomalies = points
      .map((p) => ({ ...p, z: (p.score - mean) / stddev }))
      .filter((p) => Math.abs(p.z) >= Z_THRESHOLD);
    return res.json({
      window_days: WINDOW_DAYS,
      threshold_z: Z_THRESHOLD,
      mean,
      stddev,
      count: points.length,
      anomalies,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;

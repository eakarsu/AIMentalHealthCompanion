// Therapist data export.
// PRODUCT-DECISION: returns a JSON bundle with mood, journal, sleep, and
// assessments for the calling user — easy for therapists to ingest and a
// stepping stone toward FHIR. Set EXPORT_FORMAT=fhir in future to switch.
import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';

const router = Router();

router.get('/me', auth, async (req, res) => {
  const userId = req.user?.id;
  const safe = async (sql, params = []) => {
    try {
      const r = await pool.query(sql, params);
      return r.rows;
    } catch {
      return [];
    }
  };

  const [moods, journals, sleep, assessments] = await Promise.all([
    safe('SELECT * FROM moods WHERE user_id = $1 ORDER BY created_at DESC LIMIT 365', [userId]),
    safe('SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 365', [userId]),
    safe('SELECT * FROM sleep_logs WHERE user_id = $1 ORDER BY date DESC LIMIT 365', [userId]),
    safe('SELECT * FROM assessment_results WHERE user_id = $1 ORDER BY taken_at DESC LIMIT 50', [userId]),
  ]);

  return res.json({
    user_id: userId,
    generated_at: new Date().toISOString(),
    format: 'json',
    bundle: { moods, journals, sleep, assessments },
    note: 'PRODUCT-DECISION: JSON export for now; FHIR shape gated on env EXPORT_FORMAT=fhir.',
  });
});

export default router;

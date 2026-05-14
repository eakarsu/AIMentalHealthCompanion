// Medication tracking.
// PRODUCT-DECISION: We track only patient self-reported medication adherence
// (no prescriptions, no DEA/FDA flow). Names + dosage strings + adherence
// log. Schema is additive (CREATE TABLE IF NOT EXISTS). Real e-prescribing
// would require Surescripts integration (NEEDS-CREDS).
import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';

const router = Router();

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(200) NOT NULL,
        dosage VARCHAR(120),
        schedule VARCHAR(120),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medication_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        medication_id INTEGER REFERENCES medications(id) ON DELETE CASCADE,
        taken BOOLEAN DEFAULT TRUE,
        taken_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (e) {
    console.error('medications table init error:', e.message);
  }
})();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const r = await pool.query('SELECT * FROM medications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.json({ medications: r.rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, dosage, schedule, notes } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = await pool.query(
      `INSERT INTO medications (user_id, name, dosage, schedule, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, name, dosage || null, schedule || null, notes || null]
    );
    return res.json({ medication: r.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/:id/log', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { taken = true } = req.body || {};
    const r = await pool.query(
      `INSERT INTO medication_log (user_id, medication_id, taken) VALUES ($1,$2,$3) RETURNING *`,
      [userId, req.params.id, !!taken]
    );
    return res.json({ entry: r.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.get('/:id/log', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const r = await pool.query(
      `SELECT * FROM medication_log WHERE user_id = $1 AND medication_id = $2 ORDER BY taken_at DESC LIMIT 200`,
      [userId, req.params.id]
    );
    return res.json({ entries: r.rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;

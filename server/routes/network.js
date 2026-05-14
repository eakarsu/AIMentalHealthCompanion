// Family / support network with explicit consent gating.
// PRODUCT-DECISION: a user explicitly grants access to a contact for one or
// more scopes (mood, journal-summary, crisis-alerts). Default scope is
// `crisis-alerts` only. Override via env DEFAULT_NETWORK_SCOPE.
import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';

const router = Router();

const DEFAULT_SCOPE = process.env.DEFAULT_NETWORK_SCOPE || 'crisis-alerts';

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(200),
        phone VARCHAR(40),
        relationship VARCHAR(80),
        scopes TEXT NOT NULL DEFAULT 'crisis-alerts',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (e) {
    console.error('support_contacts table init error:', e.message);
  }
})();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const r = await pool.query('SELECT * FROM support_contacts WHERE user_id = $1', [userId]);
    return res.json({ contacts: r.rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, email, phone, relationship, scopes } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const finalScopes = Array.isArray(scopes) ? scopes.join(',') : (scopes || DEFAULT_SCOPE);
    const r = await pool.query(
      `INSERT INTO support_contacts (user_id, name, email, phone, relationship, scopes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [userId, name, email || null, phone || null, relationship || null, finalScopes]
    );
    return res.json({ contact: r.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    await pool.query('DELETE FROM support_contacts WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;

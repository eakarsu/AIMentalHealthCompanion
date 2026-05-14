// In-app secure (encrypted-at-rest) therapist messaging.
// PRODUCT-DECISION: Until a HIPAA-compliant messaging vendor is signed,
// store messages in our own DB encrypted with AES-256-GCM using
// MSG_ENCRYPTION_KEY (32-byte hex). Defaults to a deterministic dev key
// when unset (NOT for production — log warning). Schema is additive.
import { Router } from 'express';
import crypto from 'crypto';
import pool from '../database.js';
import auth from '../middleware/auth.js';

const router = Router();

function getKey() {
  const hex = process.env.MSG_ENCRYPTION_KEY;
  if (hex && hex.length === 64) return Buffer.from(hex, 'hex');
  // Dev fallback — clearly logged, never used in prod.
  if (!getKey._warned) {
    console.warn('[secureMessaging] MSG_ENCRYPTION_KEY unset; using DEV-ONLY key. DO NOT USE IN PRODUCTION.');
    getKey._warned = true;
  }
  return crypto.createHash('sha256').update('mhc-dev-key-not-for-prod').digest();
}

function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(blob) {
  try {
    const buf = Buffer.from(blob, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const key = getKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch (e) {
    return '[decryption failed]';
  }
}

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS secure_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        therapist_id INTEGER,
        sender_role VARCHAR(20) NOT NULL,
        ciphertext TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (e) {
    console.error('secure_messages table init error:', e.message);
  }
})();

router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { therapist_id, body, sender_role = 'patient' } = req.body || {};
    if (!body) return res.status(400).json({ error: 'body required' });
    const ciphertext = encrypt(String(body));
    const r = await pool.query(
      `INSERT INTO secure_messages (user_id, therapist_id, sender_role, ciphertext) VALUES ($1,$2,$3,$4) RETURNING id, created_at, sender_role, therapist_id`,
      [userId, therapist_id || null, sender_role, ciphertext]
    );
    return res.json({ message: r.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const r = await pool.query(
      'SELECT id, sender_role, ciphertext, therapist_id, created_at FROM secure_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200',
      [userId]
    );
    const messages = r.rows.map((row) => ({
      id: row.id,
      sender_role: row.sender_role,
      therapist_id: row.therapist_id,
      created_at: row.created_at,
      body: decrypt(row.ciphertext),
    }));
    return res.json({ messages });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;

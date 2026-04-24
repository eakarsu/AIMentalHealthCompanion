import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';

const router = Router();

// GET /api/crisis
router.get('/', async (req, res) => {
  try {
    const { category, is_emergency } = req.query;
    let query = 'SELECT * FROM crisis_resources';
    const params = [];
    const conditions = [];
    if (category) { params.push(category); conditions.push(`category = $${params.length}`); }
    if (is_emergency !== undefined) { params.push(is_emergency === 'true'); conditions.push(`is_emergency = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY is_emergency DESC, created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get crisis resources error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/crisis/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM crisis_resources WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Crisis resource not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get crisis resource error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/crisis
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, phone, text_line, website, hours, category, is_emergency } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO crisis_resources (name, description, phone, text_line, website, hours, category, is_emergency) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, description, phone, text_line, website, hours, category, is_emergency || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create crisis resource error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/crisis/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, phone, text_line, website, hours, category, is_emergency } = req.body;
    const result = await pool.query(
      `UPDATE crisis_resources SET
        name=COALESCE($1,name), description=COALESCE($2,description), phone=COALESCE($3,phone),
        text_line=COALESCE($4,text_line), website=COALESCE($5,website), hours=COALESCE($6,hours),
        category=COALESCE($7,category), is_emergency=COALESCE($8,is_emergency)
      WHERE id=$9 RETURNING *`,
      [name, description, phone, text_line, website, hours, category, is_emergency, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Crisis resource not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update crisis resource error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/crisis/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM crisis_resources WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Crisis resource not found' });
    res.json({ message: 'Crisis resource deleted' });
  } catch (error) {
    console.error('Delete crisis resource error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

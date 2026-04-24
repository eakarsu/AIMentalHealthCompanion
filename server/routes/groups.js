import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';

const router = Router();

// GET /api/groups
router.get('/', async (req, res) => {
  try {
    const { category, is_active } = req.query;
    let query = 'SELECT * FROM support_groups';
    const params = [];
    const conditions = [];
    if (category) { params.push(category); conditions.push(`category = $${params.length}`); }
    if (is_active !== undefined) { params.push(is_active === 'true'); conditions.push(`is_active = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/groups/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM support_groups WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Support group not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/groups
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, meeting_schedule, max_members, facilitator } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO support_groups (name, description, category, meeting_schedule, max_members, facilitator) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, description, category, meeting_schedule, max_members || 20, facilitator]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/groups/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, category, meeting_schedule, max_members, facilitator, is_active } = req.body;
    const result = await pool.query(
      `UPDATE support_groups SET
        name=COALESCE($1,name), description=COALESCE($2,description), category=COALESCE($3,category),
        meeting_schedule=COALESCE($4,meeting_schedule), max_members=COALESCE($5,max_members),
        facilitator=COALESCE($6,facilitator), is_active=COALESCE($7,is_active)
      WHERE id=$8 RETURNING *`,
      [name, description, category, meeting_schedule, max_members, facilitator, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Support group not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/groups/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await pool.query('SELECT * FROM support_groups WHERE id = $1', [req.params.id]);
    if (group.rows.length === 0) return res.status(404).json({ error: 'Support group not found' });
    if (group.rows[0].current_members >= group.rows[0].max_members) {
      return res.status(400).json({ error: 'Group is full' });
    }
    const result = await pool.query(
      'UPDATE support_groups SET current_members = current_members + 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    res.json({ message: 'Joined group successfully', group: result.rows[0] });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/groups/:id/leave
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await pool.query('SELECT * FROM support_groups WHERE id = $1', [req.params.id]);
    if (group.rows.length === 0) return res.status(404).json({ error: 'Support group not found' });
    if (group.rows[0].current_members <= 0) {
      return res.status(400).json({ error: 'Cannot leave - no members in group' });
    }
    const result = await pool.query(
      'UPDATE support_groups SET current_members = current_members - 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    res.json({ message: 'Left group successfully', group: result.rows[0] });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/groups/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM support_groups WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Support group not found' });
    res.json({ message: 'Support group deleted' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

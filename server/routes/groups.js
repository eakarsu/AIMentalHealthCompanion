import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';

const router = Router();

// GET /api/groups
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    if (authHeader) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (_) {}
    }

    const { category, is_active } = req.query;
    let query, params = [], conditions = [];

    if (userId) {
      query = `SELECT sg.*,
        COUNT(DISTINCT sgm.user_id)::int AS member_count,
        EXISTS(SELECT 1 FROM support_group_members WHERE group_id = sg.id AND user_id = $1) AS is_member
        FROM support_groups sg
        LEFT JOIN support_group_members sgm ON sgm.group_id = sg.id`;
      params.push(userId);
    } else {
      query = `SELECT sg.*,
        COUNT(DISTINCT sgm.user_id)::int AS member_count,
        FALSE AS is_member
        FROM support_groups sg
        LEFT JOIN support_group_members sgm ON sgm.group_id = sg.id`;
    }

    if (category) { params.push(category); conditions.push(`sg.category = $${params.length}`); }
    if (is_active !== undefined) { params.push(is_active === 'true'); conditions.push(`sg.is_active = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' GROUP BY sg.id ORDER BY sg.created_at DESC';

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
    const result = await pool.query(
      `SELECT sg.*, COUNT(DISTINCT sgm.user_id)::int AS member_count
       FROM support_groups sg
       LEFT JOIN support_group_members sgm ON sgm.group_id = sg.id
       WHERE sg.id = $1
       GROUP BY sg.id`,
      [req.params.id]
    );
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
    const group = await pool.query(
      `SELECT sg.*, COUNT(DISTINCT sgm.user_id)::int AS member_count
       FROM support_groups sg
       LEFT JOIN support_group_members sgm ON sgm.group_id = sg.id
       WHERE sg.id = $1 GROUP BY sg.id`,
      [req.params.id]
    );
    if (group.rows.length === 0) return res.status(404).json({ error: 'Support group not found' });

    const g = group.rows[0];
    if (g.member_count >= g.max_members) {
      return res.status(400).json({ error: 'Group is full' });
    }

    await pool.query(
      'INSERT INTO support_group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT (group_id, user_id) DO NOTHING',
      [req.params.id, req.user.id]
    );

    const updated = await pool.query(
      `SELECT sg.*, COUNT(DISTINCT sgm.user_id)::int AS member_count, TRUE AS is_member
       FROM support_groups sg
       LEFT JOIN support_group_members sgm ON sgm.group_id = sg.id
       WHERE sg.id = $1 GROUP BY sg.id`,
      [req.params.id]
    );

    res.json({ message: 'Joined group successfully', group: updated.rows[0] });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/groups/:id/leave
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM support_group_members WHERE group_id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'You are not a member of this group' });
    }
    res.json({ message: 'Left group successfully' });
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

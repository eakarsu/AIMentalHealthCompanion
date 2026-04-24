import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { getAIResponse } from '../utils/ai.js';

const router = Router();

// GET /api/therapists/search
router.get('/search', async (req, res) => {
  try {
    const { q, specialization, accepts_insurance, min_rating } = req.query;
    let query = 'SELECT * FROM therapists';
    const params = [];
    const conditions = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(name ILIKE $${params.length} OR bio ILIKE $${params.length} OR approach ILIKE $${params.length})`);
    }
    if (specialization) {
      params.push(specialization);
      conditions.push(`$${params.length} = ANY(specializations)`);
    }
    if (accepts_insurance !== undefined) {
      params.push(accepts_insurance === 'true');
      conditions.push(`accepts_insurance = $${params.length}`);
    }
    if (min_rating) {
      params.push(parseFloat(min_rating));
      conditions.push(`rating >= $${params.length}`);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY rating DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Search therapists error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/therapists
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM therapists ORDER BY rating DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get therapists error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/therapists/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM therapists WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Therapist not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get therapist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/therapists
router.post('/', auth, async (req, res) => {
  try {
    const { name, title, specializations, approach, experience_years, rating, reviews_count, phone, email, website, address, accepts_insurance, price_range, availability, image_url, bio } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await pool.query(
      `INSERT INTO therapists (name, title, specializations, approach, experience_years, rating, reviews_count, phone, email, website, address, accepts_insurance, price_range, availability, image_url, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [name, title, specializations, approach, experience_years, rating, reviews_count || 0, phone, email, website, address, accepts_insurance !== undefined ? accepts_insurance : true, price_range, availability, image_url, bio]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create therapist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/therapists/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, title, specializations, approach, experience_years, rating, reviews_count, phone, email, website, address, accepts_insurance, price_range, availability, image_url, bio } = req.body;
    const result = await pool.query(
      `UPDATE therapists SET
        name=COALESCE($1,name), title=COALESCE($2,title), specializations=COALESCE($3,specializations),
        approach=COALESCE($4,approach), experience_years=COALESCE($5,experience_years),
        rating=COALESCE($6,rating), reviews_count=COALESCE($7,reviews_count),
        phone=COALESCE($8,phone), email=COALESCE($9,email), website=COALESCE($10,website),
        address=COALESCE($11,address), accepts_insurance=COALESCE($12,accepts_insurance),
        price_range=COALESCE($13,price_range), availability=COALESCE($14,availability),
        image_url=COALESCE($15,image_url), bio=COALESCE($16,bio)
      WHERE id=$17 RETURNING *`,
      [name, title, specializations, approach, experience_years, rating, reviews_count, phone, email, website, address, accepts_insurance, price_range, availability, image_url, bio, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Therapist not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update therapist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/therapists/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM therapists WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Therapist not found' });
    res.json({ message: 'Therapist deleted' });
  } catch (error) {
    console.error('Delete therapist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/therapists/match - AI helps match user with therapists
router.post('/match', auth, async (req, res) => {
  try {
    const { concerns, preferences, previous_therapy } = req.body;
    const therapistsResult = await pool.query('SELECT name, title, specializations, approach, experience_years, rating, price_range, availability FROM therapists ORDER BY rating DESC');

    const analysis = await getAIResponse(
      'You are a helpful therapy matching advisor. Based on the user\'s needs and the available therapists, recommend the top 2-3 best matches. For each recommendation: explain why this therapist is a good fit, what their approach means in practical terms, and what to expect in a first session. Also provide general tips for choosing a therapist. Be supportive and normalize seeking help. Do not diagnose or replace professional consultation.',
      `User concerns: ${concerns || 'general mental health support'}\nPreferences: ${preferences || 'none specified'}\nPrevious therapy experience: ${previous_therapy || 'not specified'}\n\nAvailable therapists:\n${therapistsResult.rows.map(t => `- ${t.name} (${t.title}): specializes in ${(t.specializations || []).join(', ')}, approach: ${t.approach}, ${t.experience_years} years exp, rating: ${t.rating}, ${t.price_range}, availability: ${t.availability}`).join('\n')}`
    );

    res.json({ analysis });
  } catch (error) {
    console.error('Therapist matching error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';

const router = Router();

// GET /api/assessments
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM assessments';
    const params = [];
    if (category) { params.push(category); query += ' WHERE category = $1'; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/assessments/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assessment not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/assessments
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, questions, scoring_guide } = req.body;
    if (!title || !questions) return res.status(400).json({ error: 'Title and questions are required' });
    const result = await pool.query(
      'INSERT INTO assessments (title, description, category, questions, scoring_guide) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, description, category, JSON.stringify(questions), scoring_guide ? JSON.stringify(scoring_guide) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/assessments/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, category, questions, scoring_guide } = req.body;
    const result = await pool.query(
      `UPDATE assessments SET
        title=COALESCE($1,title), description=COALESCE($2,description), category=COALESCE($3,category),
        questions=COALESCE($4,questions), scoring_guide=COALESCE($5,scoring_guide)
      WHERE id=$6 RETURNING *`,
      [title, description, category, questions ? JSON.stringify(questions) : null, scoring_guide ? JSON.stringify(scoring_guide) : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assessment not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/assessments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM assessments WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assessment not found' });
    res.json({ message: 'Assessment deleted' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/assessments/:id/take - Take an assessment and get AI feedback
router.post('/:id/take', auth, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers) return res.status(400).json({ error: 'Answers are required' });

    const assessmentResult = await pool.query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
    if (assessmentResult.rows.length === 0) return res.status(404).json({ error: 'Assessment not found' });

    const assessment = assessmentResult.rows[0];

    // Calculate score
    let score = 0;
    if (Array.isArray(answers)) {
      score = answers.reduce((sum, a) => sum + (typeof a === 'number' ? a : 0), 0);
    }

    // Determine interpretation from scoring guide
    let interpretation = 'Score recorded';
    if (assessment.scoring_guide && assessment.scoring_guide.ranges) {
      const range = assessment.scoring_guide.ranges.find(r => score >= r.min && score <= r.max);
      if (range) {
        interpretation = `${range.label}: ${range.description}`;
      }
    }

    // Get AI feedback
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate mental health AI assistant. Provide supportive, non-diagnostic feedback on mental health assessment results. Suggest self-care strategies and encourage professional support when appropriate. Be warm and validating.'
          },
          {
            role: 'user',
            content: `I just completed the ${assessment.title}. My score was ${score} out of ${assessment.scoring_guide?.max_score || 'unknown'}. The interpretation is: ${interpretation}. Please provide supportive feedback and suggestions.`
          }
        ]
      })
    });

    const data = await response.json();
    const ai_feedback = data.choices?.[0]?.message?.content || 'Thank you for completing this assessment. Consider discussing your results with a mental health professional.';

    const resultInsert = await pool.query(
      'INSERT INTO assessment_results (user_id, assessment_id, answers, score, interpretation, ai_feedback) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.id, req.params.id, JSON.stringify(answers), score, interpretation, ai_feedback]
    );

    res.status(201).json(resultInsert.rows[0]);
  } catch (error) {
    console.error('Take assessment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/assessments/results/mine - Get user's assessment results
router.get('/results/mine', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ar.*, a.title as assessment_title, a.category as assessment_category
       FROM assessment_results ar
       JOIN assessments a ON ar.assessment_id = a.id
       WHERE ar.user_id = $1 ORDER BY ar.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get assessment results error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { parseAIJson, detectCrisis, CRISIS_RESOURCES } from '../utils/ai.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /api/journal
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/journal/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/journal
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, mood, tags, is_private, type } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required and cannot be empty' });
    }
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const result = await pool.query(
      'INSERT INTO journal_entries (user_id, title, content, mood, tags, is_private) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, title, content, mood, tags, is_private !== undefined ? is_private : true]
    );

    const entry = result.rows[0];
    const response = { ...entry };

    // Crisis detection
    if (detectCrisis(content)) {
      await pool.query(
        'INSERT INTO crisis_alerts (user_id, source, content_snippet) VALUES ($1, $2, $3)',
        [req.user.id, 'journal', content.substring(0, 200)]
      );
      response.crisis_alert = true;
      response.crisis_resources = CRISIS_RESOURCES;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/journal/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, mood, tags, is_private } = req.body;
    const result = await pool.query(
      `UPDATE journal_entries SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        mood = COALESCE($3, mood),
        tags = COALESCE($4, tags),
        is_private = COALESCE($5, is_private),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND user_id = $7 RETURNING *`,
      [title, content, mood, tags, is_private, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/journal/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json({ message: 'Journal entry deleted', entry: result.rows[0] });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/journal/:id/analyze
router.post('/:id/analyze', auth, aiLimiter, async (req, res) => {
  try {
    const entryResult = await pool.query(
      'SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    const entry = entryResult.rows[0];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate mental health AI assistant. Analyze the journal entry and provide thoughtful, supportive insights. Do not diagnose. Be warm and encouraging. Always return valid JSON.'
          },
          {
            role: 'user',
            content: `Please analyze this journal entry and return JSON only:\n\nTitle: ${entry.title}\nMood: ${entry.mood || 'not specified'}\nContent: ${entry.content}\n\nReturn JSON: { sentiment: 'positive|negative|neutral|mixed', mood_indicators: [], cognitive_distortions: [], strengths_observed: [], gentle_suggestions: [], overall_tone }`
          }
        ]
      })
    });

    if (!response.ok) throw new Error('AI service error: ' + response.status);

    const data = await response.json();
    const rawAnalysis = data.choices?.[0]?.message?.content || '';
    const parsedAnalysis = parseAIJson(rawAnalysis) || { raw: rawAnalysis };

    // Persist to ai_analyses
    await pool.query(
      'INSERT INTO ai_analyses (user_id, analysis_type, input_summary, result) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'journal_analysis', entry.title, JSON.stringify(parsedAnalysis)]
    );

    // Save raw analysis on journal entry too
    await pool.query(
      'UPDATE journal_entries SET ai_analysis = $1 WHERE id = $2',
      [JSON.stringify(parsedAnalysis), req.params.id]
    );

    const responsePayload = { analysis: parsedAnalysis };

    // Crisis check on content
    if (detectCrisis(entry.content)) {
      await pool.query(
        'INSERT INTO crisis_alerts (user_id, source, content_snippet) VALUES ($1, $2, $3)',
        [req.user.id, 'journal_analyze', entry.content.substring(0, 200)]
      );
      responsePayload.crisis_alert = true;
      responsePayload.crisis_resources = CRISIS_RESOURCES;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('Journal analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/journal/cbt-record - CBT thought record
router.post('/cbt-record', auth, aiLimiter, async (req, res) => {
  try {
    const { situation, automatic_thought, evidence_for, evidence_against } = req.body;
    if (!situation || !automatic_thought) {
      return res.status(400).json({ error: 'situation and automatic_thought are required' });
    }

    const prompt = `As a compassionate CBT guide, analyze this thought record and identify cognitive distortions.\n\nSituation: ${situation}\nAutomatic Thought: ${automatic_thought}\nEvidence For: ${evidence_for || 'None provided'}\nEvidence Against: ${evidence_against || 'None provided'}\n\nReturn JSON: { cognitive_distortions: [{name, explanation}], balanced_thought, reality_check, affirmation }`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: 'You are a compassionate CBT-trained therapist AI. Help users identify and reframe cognitive distortions. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) throw new Error('AI service error');
    const data = await response.json();
    const rawResult = data.choices?.[0]?.message?.content || '';
    const parsedResult = parseAIJson(rawResult) || { raw: rawResult };

    // Save as journal entry with type='cbt'
    const entryContent = `Situation: ${situation}\n\nAutomatic Thought: ${automatic_thought}\n\nEvidence For: ${evidence_for || 'None'}\n\nEvidence Against: ${evidence_against || 'None'}`;
    const saved = await pool.query(
      'INSERT INTO journal_entries (user_id, title, content, mood, is_private) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, `CBT Record: ${situation.substring(0, 50)}`, entryContent, 'reflective', true]
    );

    // Save AI analysis
    await pool.query(
      'INSERT INTO ai_analyses (user_id, analysis_type, input_summary, result) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'cbt_record', situation.substring(0, 100), JSON.stringify(parsedResult)]
    );

    res.status(201).json({ entry: saved.rows[0], analysis: parsedResult });
  } catch (error) {
    console.error('CBT record error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

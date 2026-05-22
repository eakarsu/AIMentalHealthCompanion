import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { detectCrisis, CRISIS_RESOURCES } from '../utils/ai.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /api/chat/sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, title, created_at, updated_at FROM ai_chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/chat/sessions/:id
router.get('/sessions/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ai_chat_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/chat/sessions
router.post('/sessions', auth, async (req, res) => {
  try {
    const { title } = req.body;
    const result = await pool.query(
      'INSERT INTO ai_chat_sessions (user_id, title) VALUES ($1, $2) RETURNING *',
      [req.user.id, title || 'New Chat']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create chat session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/chat/sessions/:id/message
router.post('/sessions/:id/message', auth, aiLimiter, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const sessionResult = await pool.query(
      'SELECT * FROM ai_chat_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    const session = sessionResult.rows[0];
    const previousMessages = Array.isArray(session.messages) ? session.messages : [];

    const userMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate AI mental health companion. You provide emotional support, active listening, and evidence-based coping strategies. You are warm, empathetic, and non-judgmental. You do not diagnose conditions or replace professional therapy. If someone is in crisis, encourage them to contact emergency services or a crisis hotline like 988. Always validate feelings before offering suggestions.'
          },
          ...previousMessages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) throw new Error('AI service error: ' + response.status);

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || 'I apologize, but I am having trouble responding right now. Please try again.';
    const aiMessage = { role: 'assistant', content: aiContent, timestamp: new Date().toISOString() };

    const updatedMessages = [...previousMessages, userMessage, aiMessage];

    await pool.query(
      'UPDATE ai_chat_sessions SET messages = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(updatedMessages), req.params.id]
    );

    const responsePayload = { userMessage, aiMessage };

    // Crisis detection on user message
    if (detectCrisis(message)) {
      await pool.query(
        'INSERT INTO crisis_alerts (user_id, source, content_snippet) VALUES ($1, $2, $3)',
        [req.user.id, 'chat', message.substring(0, 200)]
      );
      responsePayload.crisis_alert = true;
      responsePayload.crisis_resources = CRISIS_RESOURCES;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/chat/sessions/:id
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM ai_chat_sessions WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    res.json({ message: 'Chat session deleted' });
  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

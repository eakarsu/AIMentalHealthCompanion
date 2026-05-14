import { Router } from 'express';
import pool from '../database.js';
import auth from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { getAIResponse, parseAIJson, detectCrisis, CRISIS_RESOURCES } from '../utils/ai.js';

const router = Router();

// POST /api/ai/journal-sentiment
router.post('/journal-sentiment', auth, aiLimiter, async (req, res) => {
  try {
    const { entry } = req.body;
    if (!entry) return res.status(400).json({ error: 'entry is required' });
    const crisis = detectCrisis(entry);

    const systemPrompt = 'You are a supportive mental wellness AI. Analyze a journal entry for sentiment and emotional themes. Respond ONLY with JSON, no markdown fences.';
    const userPrompt = `Analyze this journal entry.

Entry: """${entry}"""

JSON: { "overall_sentiment": "positive"|"negative"|"neutral"|"mixed", "score": number (-100 to 100), "emotions": [string], "themes": [string], "supportive_reflection": string }`;

    const raw = await getAIResponse(systemPrompt, userPrompt);
    const structured = parseAIJson(raw);
    res.json({ raw, structured, crisis_detected: crisis, crisis_resources: crisis ? CRISIS_RESOURCES : undefined });
  } catch (error) {
    console.error('Journal sentiment error:', error.message);
    res.status(500).json({ error: 'Failed to analyze journal sentiment' });
  }
});

// POST /api/ai/crisis-assessment
router.post('/crisis-assessment', auth, aiLimiter, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const keywordCrisis = detectCrisis(message);

    const systemPrompt = 'You are a clinically informed mental wellness AI. Score crisis risk in user messages. Always include crisis resources at the end. Respond ONLY with JSON, no markdown fences.';
    const userPrompt = `Score crisis risk in this message.

Message: """${message}"""

JSON: { "risk_level": "low"|"moderate"|"high"|"imminent", "risk_score": number (0-100), "warning_signs": [string], "protective_factors": [string], "recommended_action": string, "should_escalate": boolean }`;

    const raw = await getAIResponse(systemPrompt, userPrompt);
    const structured = parseAIJson(raw);
    const escalate = keywordCrisis || (structured && (structured.should_escalate || ['high', 'imminent'].includes(structured.risk_level)));
    res.json({
      raw,
      structured,
      keyword_crisis: keywordCrisis,
      crisis_resources: escalate ? CRISIS_RESOURCES : undefined,
    });
  } catch (error) {
    console.error('Crisis assessment error:', error.message);
    res.status(500).json({ error: 'Failed to assess crisis risk' });
  }
});

// POST /api/ai/coping-recommendation
router.post('/coping-recommendation', auth, aiLimiter, async (req, res) => {
  try {
    const { trigger, mood, history } = req.body;

    let strategies = [];
    try {
      const r = await pool.query('SELECT id, name, description, category FROM coping_strategies LIMIT 100');
      strategies = r.rows;
    } catch (e) { /* table optional */ }

    const systemPrompt = 'You are a compassionate mental wellness coach. Recommend evidence-based coping strategies. Respond ONLY with JSON, no markdown fences.';
    const userPrompt = `Recommend coping strategies.

Trigger: ${trigger || 'unspecified'}
Current mood: ${mood || 'unspecified'}
Recent history (optional): ${history || 'unspecified'}
Available strategies in catalog (optional): ${JSON.stringify(strategies).slice(0, 3000)}

JSON: { "recommendations": [{ "strategy": string, "why_it_helps": string, "duration_minutes": number, "category": string, "catalog_id": any }], "immediate_action": string, "longer_term_practice": string }`;

    const raw = await getAIResponse(systemPrompt, userPrompt);
    const structured = parseAIJson(raw);
    res.json({ raw, structured });
  } catch (error) {
    console.error('Coping recommendation error:', error.message);
    res.status(500).json({ error: 'Failed to recommend coping strategies' });
  }
});

// POST /api/ai/therapist-match
router.post('/therapist-match', auth, aiLimiter, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'AI provider not configured' });
  try {
    const { preferences, concerns, modality, location } = req.body;
    if (!preferences && !concerns) return res.status(400).json({ error: 'preferences or concerns is required' });

    let therapists = [];
    try {
      const r = await pool.query('SELECT id, name, specialties, modalities, languages, location, bio FROM therapists LIMIT 200');
      therapists = r.rows;
    } catch (e) { /* table optional */ }

    const systemPrompt = 'You are a thoughtful mental wellness matching assistant. Rank therapists for fit. Respond ONLY with JSON, no markdown fences.';
    const userPrompt = `Match a user with therapists.

User preferences: ${preferences || 'unspecified'}
Concerns: ${concerns || 'unspecified'}
Preferred modality: ${modality || 'unspecified'}
Location: ${location || 'unspecified'}

Available therapists (may be empty): ${JSON.stringify(therapists).slice(0, 4000)}

JSON: { "matches": [{ "therapist_id": any, "name": string, "score": number (0-100), "reasons": [string], "fit_summary": string }], "no_match_reason": string|null, "next_steps": string }`;

    const raw = await getAIResponse(systemPrompt, userPrompt);
    const structured = parseAIJson(raw);
    res.json({ raw, structured });
  } catch (error) {
    console.error('Therapist match error:', error.message);
    res.status(500).json({ error: 'Failed to match therapist' });
  }
});

// POST /api/ai/sleep-advisor
router.post('/sleep-advisor', auth, aiLimiter, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'AI provider not configured' });
  try {
    const { sleep_logs, current_routine, goals } = req.body;

    const systemPrompt = 'You are an evidence-based sleep coach grounded in CBT-I principles. Respond ONLY with JSON, no markdown fences.';
    const userPrompt = `Advise on sleep improvement.

Sleep logs (optional, JSON or text): ${typeof sleep_logs === 'string' ? sleep_logs : JSON.stringify(sleep_logs || [])}
Current routine: ${current_routine || 'unspecified'}
Goals: ${goals || 'unspecified'}

JSON: { "summary": string, "issues_identified": [string], "recommendations": [{ "action": string, "rationale": string, "when": string }], "wind_down_routine": [string], "monitoring_metrics": [string] }`;

    const raw = await getAIResponse(systemPrompt, userPrompt);
    const structured = parseAIJson(raw);
    res.json({ raw, structured });
  } catch (error) {
    console.error('Sleep advisor error:', error.message);
    res.status(500).json({ error: 'Failed to generate sleep advice' });
  }
});

// POST /api/ai/mood-trend-analysis
router.post('/mood-trend-analysis', auth, aiLimiter, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'AI provider not configured' });
  try {
    const { mood_logs, range_days } = req.body;

    let aggregate = null;
    try {
      const days = Math.max(1, Math.min(365, parseInt(range_days) || 30));
      const r = await pool.query(
        `SELECT mood_label, AVG(mood_score)::float AS avg_score, COUNT(*)::int AS n
         FROM moods
         WHERE user_id = $1 AND created_at > NOW() - ($2 || ' days')::interval
         GROUP BY mood_label
         ORDER BY n DESC LIMIT 50`,
        [req.user?.id || req.user?.userId || null, String(days)]
      );
      aggregate = r.rows;
    } catch (e) { /* table optional */ }

    const systemPrompt = 'You are a mental wellness analyst. Identify trends and triggers. Respond ONLY with JSON, no markdown fences.';
    const userPrompt = `Analyze mood trends.

Provided mood logs (optional, JSON): ${typeof mood_logs === 'string' ? mood_logs : JSON.stringify(mood_logs || [])}
Database aggregate (may be empty): ${JSON.stringify(aggregate || [])}
Range (days): ${range_days || 30}

JSON: { "summary": string, "trend_direction": "improving"|"declining"|"stable"|"mixed", "notable_patterns": [string], "possible_triggers": [string], "recommendations": [string], "supportive_note": string }`;

    const raw = await getAIResponse(systemPrompt, userPrompt);
    const structured = parseAIJson(raw);
    res.json({ raw, structured, aggregate });
  } catch (error) {
    console.error('Mood trend analysis error:', error.message);
    res.status(500).json({ error: 'Failed to analyze mood trend' });
  }
});

export default router;

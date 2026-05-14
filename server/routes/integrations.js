// External integrations for the Mental Health Companion.
// All routes return HTTP 503 with {error, missing} when the relevant env
// vars are not configured; never executes real API calls in this stub.
//
// Required env vars by integration:
//   Twilio crisis SMS: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
//   Apple HealthKit:   HEALTHKIT_TEAM_ID, HEALTHKIT_KEY_ID, HEALTHKIT_PRIVATE_KEY
//   Fitbit:            FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET
//   Voice (Deepgram):  DEEPGRAM_API_KEY
//   Zoom:              ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
import { Router } from 'express';
import auth from '../middleware/auth.js';

const router = Router();

function require503(envVars) {
  const missing = envVars.filter((v) => !process.env[v]);
  return missing.length > 0 ? missing : null;
}

router.post('/sms/twilio', auth, async (req, res) => {
  const missing = require503(['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER']);
  if (missing) {
    return res.status(503).json({
      error: 'Twilio not configured',
      missing: missing.join(', '),
      configure: 'Set Twilio env vars to enable crisis SMS (988 referral).',
    });
  }
  const { to, message } = req.body || {};
  if (!to || !message) return res.status(400).json({ error: 'to and message required' });
  return res.json({ ok: true, provider: 'twilio', to, simulated: true });
});

router.post('/healthkit/import', auth, async (req, res) => {
  const missing = require503(['HEALTHKIT_TEAM_ID', 'HEALTHKIT_KEY_ID', 'HEALTHKIT_PRIVATE_KEY']);
  if (missing) {
    return res.status(503).json({
      error: 'Apple HealthKit not configured',
      missing: missing.join(', '),
      configure: 'Set HealthKit env vars to enable smartwatch import.',
    });
  }
  return res.json({ ok: true, provider: 'healthkit', samples: [], simulated: true });
});

router.post('/fitbit/import', auth, async (req, res) => {
  const missing = require503(['FITBIT_CLIENT_ID', 'FITBIT_CLIENT_SECRET']);
  if (missing) {
    return res.status(503).json({
      error: 'Fitbit not configured',
      missing: missing.join(', '),
      configure: 'Set Fitbit env vars to enable smartwatch import.',
    });
  }
  return res.json({ ok: true, provider: 'fitbit', samples: [], simulated: true });
});

router.post('/voice/transcribe', auth, async (req, res) => {
  const missing = require503(['DEEPGRAM_API_KEY']);
  if (missing) {
    return res.status(503).json({
      error: 'Deepgram not configured',
      missing: missing.join(', '),
      configure: 'Set DEEPGRAM_API_KEY for voice therapy ASR.',
    });
  }
  return res.json({ ok: true, provider: 'deepgram', transcript: '', simulated: true });
});

router.post('/zoom/session', auth, async (req, res) => {
  const missing = require503(['ZOOM_ACCOUNT_ID', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET']);
  if (missing) {
    return res.status(503).json({
      error: 'Zoom not configured',
      missing: missing.join(', '),
      configure: 'Set Zoom env vars to enable video therapy.',
    });
  }
  return res.json({ ok: true, provider: 'zoom', session_url: 'simulated', simulated: true });
});

export default router;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

import authRoutes from './routes/auth.js';
import moodRoutes from './routes/moods.js';
import journalRoutes from './routes/journal.js';
import chatRoutes from './routes/chat.js';
import meditationRoutes from './routes/meditation.js';
import breathingRoutes from './routes/breathing.js';
import selfcareRoutes from './routes/selfcare.js';
import copingRoutes from './routes/coping.js';
import assessmentRoutes from './routes/assessments.js';
import goalRoutes from './routes/goals.js';
import groupRoutes from './routes/groups.js';
import crisisRoutes from './routes/crisis.js';
import affirmationRoutes from './routes/affirmations.js';
import sleepRoutes from './routes/sleep.js';
import gratitudeRoutes from './routes/gratitude.js';
import therapistRoutes from './routes/therapists.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import integrationRoutes from './routes/integrations.js';
import medicationRoutes from './routes/medication.js';
import networkRoutes from './routes/network.js';
import exportRoutes from './routes/exportData.js';
import secureMessagingRoutes from './routes/secureMessaging.js';
import anomalyRoutes from './routes/anomaly.js';
import safetyPlanAdherenceRoutes from './routes/safety-plan-adherence.js';
import governanceRouter from './governance/router.js';
import governanceRuntime from './governance/runtime.cjs';
import providerGateModule from './governance/providerGate.cjs';

import pool from './database.js';

governanceRuntime.validateRuntime();

// === BATCH 05 AUTO-MOUNT imports ===
import companionAgent247Router from './routes/companion-agent-24-7.js';
import moodAnomalyStreamRouter from './routes/mood-anomaly-stream.js';
import cbtDbtAgentRouter from './routes/cbt-dbt-agent.js';
import voiceTherapyAccessRouter from './routes/voice-therapy-access.js';
import peerSupportOrchestrationRouter from './routes/peer-support-orchestration.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security middleware
app.use(helmet());
const allowedOrigins = String(process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean);
app.use(cors({ origin:(origin,callback)=>!origin||allowedOrigins.includes(origin)?callback(null,true):callback(new Error('Origin not allowed by CORS')),credentials:true }));
app.use(express.json({ limit: '10mb' }));
app.use(providerGateModule.createProviderGate(['/api/companion-agent-24-7','/api/mood-anomaly-stream','/api/cbt-dbt-agent','/api/voice-therapy-access','/api/peer-support-orchestration']));

// Run DB migrations
async function runMigrations() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS crisis_alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        source VARCHAR(20),
        content_snippet TEXT,
        detected_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        analysis_type VARCHAR(50),
        input_summary TEXT,
        result JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES support_groups(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(group_id, user_id)
      )
    `);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(128)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP`);
    console.log('DB migrations complete');
  } catch (e) {
    console.error('Migration error:', e.message);
  }
}

if (process.env.ENABLE_LEGACY_SCHEMA_BOOTSTRAP === 'true') runMigrations();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/meditation', meditationRoutes);
app.use('/api/breathing', breathingRoutes);
app.use('/api/selfcare', selfcareRoutes);
app.use('/api/coping', copingRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/crisis', crisisRoutes);
app.use('/api/affirmations', affirmationRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/gratitude', gratitudeRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/secure-messages', secureMessagingRoutes);
app.use('/api/anomaly', anomalyRoutes);
app.use('/api/safety-plan-adherence', safetyPlanAdherenceRoutes);
app.use('/api/governed-care-support', governanceRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Mental Health Companion API running on port ${PORT}`);
});

export default app;


// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/companion-agent-24-7', companionAgent247Router);
app.use('/api/mood-anomaly-stream', moodAnomalyStreamRouter);
app.use('/api/cbt-dbt-agent', cbtDbtAgentRouter);
app.use('/api/voice-therapy-access', voiceTherapyAccessRouter);
app.use('/api/peer-support-orchestration', peerSupportOrchestrationRouter);

// Generated gap routes are quarantined: no mounts until durable provider contracts and acceptance tests exist.

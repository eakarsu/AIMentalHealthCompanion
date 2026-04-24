import express from 'express';
import cors from 'cors';
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

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

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

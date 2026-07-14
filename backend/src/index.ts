import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI environment variable is missing.');
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY environment variable is missing.');
  process.exit(1);
}

import { connectDB } from './config/db';
connectDB().catch(err => { console.error('❌ DB connection failed:', err); process.exit(1); });

import authRoutes from './routes/auth';
import examRoutes from './routes/exam';
import adminRoutes from './routes/admin';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed =
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin.startsWith('https://') || // allow all HTTPS (Vercel, etc.)
      origin === (process.env.FRONTEND_URL || '');
    callback(null, allowed);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'GTEC Exam API running',
    db: 'mongodb-atlas',
    gemini: 'configured',
    timestamp: new Date().toISOString()
  });
});

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n🎓 GTEC Exam API running on port ${PORT}`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});

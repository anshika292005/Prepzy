import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import userRoutes from './routes/user.routes';
import skillScoreRoutes from './routes/skillScore.routes';
import sessionRoutes from './routes/session.routes';
import questionResponseRoutes from './routes/questionResponse.routes';
import mcqRoutes from './routes/mcq.routes';
import uploadRoutes from './routes/upload.routes';
import explanationRoutes from './routes/explanation.routes';
import agentRoutes from './routes/agent.routes';
import streamRoutes from './routes/stream.routes';
import errorMiddleware from './middleware/error.middleware';

const app = express();

// ---------- Core Middleware ----------

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// ---------- Rate Limiting ----------

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const mcqLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI generation rate limit reached. Please try again later.' },
});

app.use(globalLimiter);
app.use('/api/mcq', mcqLimiter);

// ---------- Health Check ----------

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------- Routes ----------

app.use('/api/users', userRoutes);
app.use('/api/skill-scores', skillScoreRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/responses', questionResponseRoutes);
app.use('/api/mcq', mcqRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/explain', explanationRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/stream', streamRoutes);

// ---------- Error Handler (must be last) ----------

app.use(errorMiddleware);

export default app;

import { Router } from 'express';
import { createSession, getSessionsByUser, getSessionById } from '../controllers/session.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.post('/', authMiddleware, createSession);
router.get('/detail/:sessionId', authMiddleware, getSessionById);
router.get('/:userId', authMiddleware, getSessionsByUser);

export default router;

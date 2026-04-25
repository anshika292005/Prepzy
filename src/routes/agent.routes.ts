import { Router } from 'express';
import { runExamSession, runStudyPlan } from '../controllers/agent.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.post('/exam-session', authMiddleware, runExamSession);
router.post('/study-plan', authMiddleware, runStudyPlan);

export default router;

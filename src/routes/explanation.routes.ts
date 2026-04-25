import { Router } from 'express';
import { explainAnswer, askFollowUp, getDailyStudyPlan } from '../controllers/explanation.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.post('/', authMiddleware, explainAnswer);
router.post('/followup', authMiddleware, askFollowUp);
router.post('/study-plan', authMiddleware, getDailyStudyPlan);

export default router;

import { Router } from 'express';
import { generateMCQsController, analyzeWeakTopicsController } from '../controllers/mcq.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.post('/generate', authMiddleware, generateMCQsController);
router.post('/weak-topics', authMiddleware, analyzeWeakTopicsController);

export default router;

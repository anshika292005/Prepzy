import { Router } from 'express';
import { streamMCQs, streamExplanationController } from '../controllers/stream.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.get('/mcqs', authMiddleware, streamMCQs);
router.get('/explain', authMiddleware, streamExplanationController);

export default router;

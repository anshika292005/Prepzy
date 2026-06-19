/**
 * Drop at:  src/routes/analytics.routes.ts
 * Register: app.use('/api/analytics', analyticsRoutes);
 */

import { Router } from 'express';
import {
  getTopicPredictions,
  deduplicateQuestionsController,
  preprocessImageController,
  mlHealthCheck,
} from '../controllers/analytics.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.get('/health',                    mlHealthCheck);
router.get('/predictions/:userId',       authMiddleware, getTopicPredictions);
router.post('/deduplicate',              authMiddleware, deduplicateQuestionsController);
router.post('/preprocess-image',         authMiddleware, ...preprocessImageController);

export default router;

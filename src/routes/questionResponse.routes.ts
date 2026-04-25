import { Router } from 'express';
import {
  saveResponse,
  saveResponsesBatch,
  getResponsesBySession,
} from '../controllers/questionResponse.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.post('/batch', authMiddleware, saveResponsesBatch);
router.post('/', authMiddleware, saveResponse);
router.get('/:sessionId', authMiddleware, getResponsesBySession);

export default router;

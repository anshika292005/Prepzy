import { Router } from 'express';
import {
  getSkillScoresByUser,
  upsertSkillScore,
  updateEloScore,
} from '../controllers/skillScore.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.get('/:userId', authMiddleware, getSkillScoresByUser);
router.post('/', authMiddleware, upsertSkillScore);
router.patch('/:id', authMiddleware, updateEloScore);

export default router;

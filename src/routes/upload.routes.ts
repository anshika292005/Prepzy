import { Router } from 'express';
import { uploadNotes, deleteNotes, listTopics } from '../controllers/upload.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.post('/notes', authMiddleware, uploadNotes);
router.delete('/notes', authMiddleware, deleteNotes);
router.get('/topics/:userId', authMiddleware, listTopics);

export default router;

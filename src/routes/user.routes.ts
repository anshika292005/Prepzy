import { Router } from 'express';
import { registerUser, getUserByAuthId, updateUser } from '../controllers/user.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// Public
router.post('/register', registerUser);

// Protected
router.get('/:authId', authMiddleware, getUserByAuthId);
router.patch('/:authId', authMiddleware, updateUser);

export default router;

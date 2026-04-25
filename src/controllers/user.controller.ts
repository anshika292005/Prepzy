import { Request, Response } from 'express';
import UserProfile from '../models/UserProfile';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthRequest } from '../types/index';

const registerUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { authId, name, examType, targetYear } = req.body as {
    authId: string;
    name: string;
    examType: string;
    targetYear: number;
  };

  const existing = await UserProfile.findOne({ authId });

  if (existing) {
    sendError(res, 'User with this authId already exists.', 409);
    return;
  }

  const profile = await UserProfile.create({
    authId,
    name,
    examType,
    targetYear,
  });

  sendSuccess(res, profile, 201);
});

const getUserByAuthId = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { authId } = req.params;

  const profile = await UserProfile.findOne({ authId });

  if (!profile) {
    sendError(res, 'User not found.', 404);
    return;
  }

  sendSuccess(res, profile);
});

const updateUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { authId } = req.params;
  const { name, examType, targetYear } = req.body as {
    name?: string;
    examType?: string;
    targetYear?: number;
  };

  const profile = await UserProfile.findOneAndUpdate(
    { authId },
    {
      ...(name !== undefined && { name }),
      ...(examType !== undefined && { examType }),
      ...(targetYear !== undefined && { targetYear }),
    },
    { new: true, runValidators: true }
  );

  if (!profile) {
    sendError(res, 'User not found.', 404);
    return;
  }

  sendSuccess(res, profile);
});

export { registerUser, getUserByAuthId, updateUser };

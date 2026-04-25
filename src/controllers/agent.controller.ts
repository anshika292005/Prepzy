import { Response } from 'express';
import { runExamAgent } from '../lib/langgraph/examAgent';
import { runStudyPlanAgent } from '../lib/langgraph/studyPlanAgent';
import UserProfile from '../models/UserProfile';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthRequest } from '../types/index';

interface ExamSessionBody {
  userId: string;
  topic: string;
  examType: string;
  count?: number;
}

interface StudyPlanBody {
  userId: string;
  examType?: string;
  availableMinutes: number;
}

const runExamSession = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, topic, examType, count = 5 } = req.body as ExamSessionBody;

  if (!userId || !topic || !examType) {
    sendError(res, 'userId, topic, and examType are required.', 400);
    return;
  }

  const result = await runExamAgent({
    userId,
    topic,
    examType,
    count,
  });

  if (result.sessionId === 'error_occurred') {
    sendError(res, 'An error occurred while generating the exam session.', 500);
    return;
  }

  sendSuccess(res, result);
});

const runStudyPlan = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, availableMinutes } = req.body as StudyPlanBody;

  if (!userId || !availableMinutes) {
    sendError(res, 'userId and availableMinutes are required.', 400);
    return;
  }

  const profile = await UserProfile.findOne({ authId: userId }) || await UserProfile.findById(userId);
  if (!profile) {
    sendError(res, 'User profile not found.', 404);
    return;
  }

  const result = await runStudyPlanAgent({
    userId,
    examType: profile.examType,
    targetYear: profile.targetYear,
    availableMinutes,
  });

  sendSuccess(res, result);
});

export { runExamSession, runStudyPlan };

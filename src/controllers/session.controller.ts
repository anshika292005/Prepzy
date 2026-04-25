import { Response } from 'express';
import Session from '../models/Session';
import QuestionResponse from '../models/QuestionResponse';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthRequest } from '../types/index';

interface SessionBody {
  userId: string;
  topic: string;
  examType: string;
  totalQuestions: number;
  correctCount: number;
  durationSeconds: number;
}

interface SessionQuery {
  topic?: string;
  examType?: string;
}

const createSession = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, topic, examType, totalQuestions, correctCount, durationSeconds } =
    req.body as SessionBody;

  const session = await Session.create({
    userId,
    topic,
    examType,
    totalQuestions,
    correctCount,
    durationSeconds,
  });

  sendSuccess(res, session, 201);
});

const getSessionsByUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.params.userId as string;
  const { topic, examType } = req.query as SessionQuery;

  const filter: Record<string, string> = { userId };
  if (topic) {
    filter.topic = topic;
  }
  if (examType) {
    filter.examType = examType;
  }

  const sessions = await Session.find(filter).sort({ createdAt: -1 });

  sendSuccess(res, sessions);
});

const getSessionById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);

  if (!session) {
    sendError(res, 'Session not found.', 404);
    return;
  }

  const responses = await QuestionResponse.find({ sessionId }).sort({ _id: 1 });

  const sessionData = {
    ...session.toObject(),
    responses,
  };

  sendSuccess(res, sessionData);
});

export { createSession, getSessionsByUser, getSessionById };

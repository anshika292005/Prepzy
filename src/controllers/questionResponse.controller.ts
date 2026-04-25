import { Response } from 'express';
import QuestionResponse from '../models/QuestionResponse';
import Session from '../models/Session';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthRequest } from '../types/index';

interface ResponseBody {
  sessionId: string;
  questionText: string;
  options: Record<string, string>;
  correctOption: string;
  studentAnswer: string;
  isCorrect: boolean;
  difficulty: string;
  aiExplanation: string;
  topic: string;
  subtopic: string;
}

const saveResponse = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const body = req.body as ResponseBody;

  const session = await Session.findById(body.sessionId);
  if (!session) {
    sendError(res, 'Session not found.', 404);
    return;
  }

  const response = await QuestionResponse.create({
    sessionId: body.sessionId,
    questionText: body.questionText,
    options: body.options,
    correctOption: body.correctOption,
    studentAnswer: body.studentAnswer,
    isCorrect: body.isCorrect,
    difficulty: body.difficulty,
    aiExplanation: body.aiExplanation,
    topic: body.topic,
    subtopic: body.subtopic,
  });

  sendSuccess(res, response, 201);
});

const saveResponsesBatch = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const responses = req.body as ResponseBody[];

  if (!Array.isArray(responses) || responses.length === 0) {
    sendError(res, 'Request body must be a non-empty array of responses.', 400);
    return;
  }

  // Validate all sessionIds match the same session
  const sessionIds = new Set(responses.map((r) => r.sessionId));
  if (sessionIds.size !== 1) {
    sendError(res, 'All responses must belong to the same session.', 400);
    return;
  }

  const sessionId = responses[0].sessionId;
  const session = await Session.findById(sessionId);
  if (!session) {
    sendError(res, 'Session not found.', 404);
    return;
  }

  const documents = responses.map((r) => ({
    sessionId: r.sessionId,
    questionText: r.questionText,
    options: r.options,
    correctOption: r.correctOption,
    studentAnswer: r.studentAnswer,
    isCorrect: r.isCorrect,
    difficulty: r.difficulty,
    aiExplanation: r.aiExplanation,
    topic: r.topic,
    subtopic: r.subtopic,
  }));

  const inserted = await QuestionResponse.insertMany(documents);

  sendSuccess(res, { insertedCount: inserted.length }, 201);
});

const getResponsesBySession = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  const responses = await QuestionResponse.find({ sessionId }).sort({ _id: 1 });

  sendSuccess(res, responses);
});

export { saveResponse, saveResponsesBatch, getResponsesBySession };

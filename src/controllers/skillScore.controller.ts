import { Response } from 'express';
import SkillScore from '../models/SkillScore';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthRequest } from '../types/index';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const K_FACTORS: Record<Difficulty, number> = {
  Easy: 16,
  Medium: 24,
  Hard: 32,
};

const QUESTION_ELO: Record<Difficulty, number> = {
  Easy: 1000,
  Medium: 1200,
  Hard: 1500,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const getSkillScoresByUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.params.userId as string;
  const { topic } = req.query as { topic?: string };

  const filter: Record<string, string> = { userId };
  if (topic) {
    filter.topic = topic;
  }

  const scores = await SkillScore.find(filter);

  sendSuccess(res, scores);
});

const upsertSkillScore = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, topic, subtopic, isCorrect } = req.body as {
    userId: string;
    topic: string;
    subtopic: string;
    isCorrect?: boolean;
  };

  const existing = await SkillScore.findOne({ userId, topic, subtopic });

  if (existing) {
    existing.totalQuestions += 1;
    if (isCorrect) {
      existing.correctCount += 1;
    }
    existing.lastPracticed = new Date();
    const updated = await existing.save();
    sendSuccess(res, updated);
    return;
  }

  const score = await SkillScore.create({
    userId,
    topic,
    subtopic,
    totalQuestions: 1,
    correctCount: isCorrect ? 1 : 0,
    lastPracticed: new Date(),
  });

  sendSuccess(res, score, 201);
});

const updateEloScore = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isCorrect, difficulty } = req.body as {
    isCorrect: boolean;
    difficulty: Difficulty;
  };

  const skillScore = await SkillScore.findById(id);

  if (!skillScore) {
    sendError(res, 'Skill score not found.', 404);
    return;
  }

  const currentScore = skillScore.skillScore;
  const questionElo = QUESTION_ELO[difficulty];
  const K = K_FACTORS[difficulty];

  const expected = 1 / (1 + Math.pow(10, (questionElo - currentScore) / 400));
  const actual = isCorrect ? 1 : 0;

  const newScore = clamp(
    Math.round(currentScore + K * (actual - expected)),
    600,
    2000
  );

  skillScore.skillScore = newScore;
  const updated = await skillScore.save();

  sendSuccess(res, updated);
});

export { getSkillScoresByUser, upsertSkillScore, updateEloScore };

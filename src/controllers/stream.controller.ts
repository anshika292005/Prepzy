import { Response } from 'express';
import { streamMCQGeneration, streamExplanation } from '../lib/streaming/streamMCQ';
import { MCQPromptParams } from '../lib/prompts/mcqGenerator'; // for type matching
import SkillScore from '../models/SkillScore';
import { ExplanationChainInput } from '../lib/langchain/chains';
import { AuthRequest } from '../types/index';
// Express route handlers aren't technically asyncHandler asyncs if they use SSE directly 
// because they manually manage res.end(), but we can wrap them in it safely if they throw.

export const streamMCQs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, topic, examType, count, content } = req.query;

  if (!topic || !examType) {
    res.status(400).json({ success: false, message: 'topic and examType required' });
    return;
  }

  let skillScore = 1200;
  if (userId && typeof userId === 'string') {
    const record = await SkillScore.findOne({ userId, topic: topic as string });
    if (record) {
      skillScore = record.skillScore;
    }
  }

  const params = {
    content: (content as string) || '',
    topic: topic as string,
    examType: examType as string,
    skillScore,
    count: count ? parseInt(count as string, 10) : 5,
  };

  await streamMCQGeneration(params as any, res);
};

export const streamExplanationController = async (req: AuthRequest, res: Response): Promise<void> => {
  const { 
    question, optionA, optionB, optionC, optionD, 
    correctOption, studentAnswer, isCorrect, examType 
  } = req.query;

  if (!question || !correctOption) {
    res.status(400).json({ success: false, message: 'Missing required explanation params' });
    return;
  }

  const params: ExplanationChainInput = {
    question: question as string,
    optionA: optionA as string,
    optionB: optionB as string,
    optionC: optionC as string,
    optionD: optionD as string,
    correctOption: correctOption as string,
    studentAnswer: studentAnswer as string,
    isCorrect: isCorrect as string,
    examType: examType as string || 'General',
  };

  await streamExplanation(params, res);
};

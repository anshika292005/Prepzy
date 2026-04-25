/**
 * Explanation controller — AI-powered answer explanations,
 * follow-up conversations, and daily study planning.
 */

import { Response } from 'express';
import { ConversationChain } from 'langchain/chains';
import { runExplanationChain, ExplanationChainInput, runStudyPlanChain } from '../lib/langchain/chains';
import { getOrCreateMemory } from '../lib/langchain/memory';
import { fastLLM } from '../lib/langchain/llm';
import { followUpPromptTemplate } from '../lib/langchain/prompts';
import SkillScore from '../models/SkillScore';
import UserProfile from '../models/UserProfile';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthRequest } from '../types/index';

// ---------- Input Interfaces ----------

interface ExplainBody {
  sessionId: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: string;
  studentAnswer: string;
  isCorrect: boolean;
  examType: string;
}

interface FollowUpBody {
  sessionId: string;
  followUpQuestion: string;
}

interface StudyPlanBody {
  userId: string;
  availableMinutes: number;
}

// ---------- Explain Answer ----------

const explainAnswer = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const body = req.body as ExplainBody;

  if (!body.sessionId || !body.question || !body.options || !body.correctOption) {
    sendError(res, 'sessionId, question, options, and correctOption are required.', 400);
    return;
  }

  // Store the explanation context in session memory for follow-ups
  const memory = getOrCreateMemory(body.sessionId);

  const input: ExplanationChainInput = {
    question: body.question,
    optionA: body.options.A,
    optionB: body.options.B,
    optionC: body.options.C,
    optionD: body.options.D,
    correctOption: body.correctOption,
    studentAnswer: body.studentAnswer,
    isCorrect: String(body.isCorrect),
    examType: body.examType,
  };

  const explanation = await runExplanationChain(input);

  // Save to memory for follow-up context
  const contextSummary = `Question: ${body.question}\nCorrect: ${body.correctOption}\nStudent answered: ${body.studentAnswer}\nWas correct: ${body.isCorrect}`;
  await memory.saveContext(
    { input: contextSummary },
    { output: explanation }
  );

  sendSuccess(res, {
    explanation,
    sessionId: body.sessionId,
  });
});

// ---------- Follow-up ----------

const askFollowUp = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { sessionId, followUpQuestion } = req.body as FollowUpBody;

  if (!sessionId || !followUpQuestion) {
    sendError(res, 'sessionId and followUpQuestion are required.', 400);
    return;
  }

  const memory = getOrCreateMemory(sessionId);

  const chain = new ConversationChain({
    llm: fastLLM,
    memory,
    prompt: followUpPromptTemplate,
  });

  const result = await chain.invoke({
    followUpQuestion,
  });

  const answer = typeof result.response === 'string'
    ? result.response
    : String(result.response);

  sendSuccess(res, {
    answer,
    sessionId,
  });
});

// ---------- Daily Study Plan ----------

const getDailyStudyPlan = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, availableMinutes } = req.body as StudyPlanBody;

  if (!userId || !availableMinutes) {
    sendError(res, 'userId and availableMinutes are required.', 400);
    return;
  }

  // Fetch user profile for exam type and target year
  const profile = await UserProfile.findOne({ authId: userId }) ||
                  await UserProfile.findById(userId);

  if (!profile) {
    sendError(res, 'User profile not found.', 404);
    return;
  }

  // Fetch skill scores to identify weak areas
  const skillScores = await SkillScore.find({ userId });

  if (skillScores.length === 0) {
    sendError(res, 'No practice data found. Complete some sessions first.', 404);
    return;
  }

  // Build weak topics summary — sorted by lowest accuracy
  const weakTopicEntries = skillScores
    .filter((s) => s.totalQuestions > 0)
    .map((s) => ({
      topic: s.topic,
      subtopic: s.subtopic || 'General',
      accuracy: s.totalQuestions > 0
        ? Math.round((s.correctCount / s.totalQuestions) * 100)
        : 0,
      skillScore: s.skillScore,
      totalQuestions: s.totalQuestions,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const weakTopicsFormatted = weakTopicEntries
    .map(
      (e) =>
        `- ${e.topic} > ${e.subtopic}: ${e.accuracy}% accuracy (${e.totalQuestions} questions, Elo ${e.skillScore})`
    )
    .join('\n');

  const plan = await runStudyPlanChain({
    weakTopics: weakTopicsFormatted,
    availableMinutes,
    examType: profile.examType,
    targetYear: profile.targetYear,
  });

  sendSuccess(res, plan);
});

export { explainAnswer, askFollowUp, getDailyStudyPlan };

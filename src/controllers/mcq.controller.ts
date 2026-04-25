// @ts-nocheck
import { Response } from 'express';
import SkillScore from '../models/SkillScore';
import { runMCQChain, runWeakTopicChain } from '../lib/langchain/chains';
import type { MCQChainInput, WeakTopicChainInput } from '../lib/langchain/chains';
import { retrieveRelevantChunks } from '../lib/rag/vectorStore';
import { rerankChunks } from '../lib/reranking/reranker';
import { getFewShotBlock } from '../lib/fewshot/fewShotExamples';
import { checkSemanticCache, storeInCache } from '../lib/cache/semanticCache';
import { filterAndRegenerateMCQs, evaluateMCQBatch } from '../lib/evaluation/selfEval';
import { filterMCQOutput } from '../lib/guardrails/contentFilter';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthRequest } from '../types/index';

// NOTE: Apply express-rate-limit at the app level for all /api/mcq/* routes
// to prevent abuse of the Claude API. Recommended: 10 requests per minute per user.

export interface GenerateBody {
  content: string;
  topic: string;
  examType: 'JEE' | 'UPSC' | 'BOTH';
  userId?: string;
  count?: number;
}

export interface WeakTopicsBody {
  userId: string;
}

const getDifficultyLabel = (skillScore: number): string => {
  if (skillScore < 1100) return 'Easy (basic recall, direct application)';
  if (skillScore < 1300) return 'Medium (multi-step reasoning, conceptual)';
  return 'Hard (advanced application, tricky distractors, exam-style)';
};

const generateMCQsController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { content, topic, examType, userId, count = 5 } = req.body as GenerateBody;

  if (!content || !topic || !examType) {
    sendError(res, 'content, topic, and examType are required.', 400);
    return;
  }

  let skillScore = 1200;
  let ragEnhanced = false;
  let context = '';

  if (userId) {
    const skillRecord = await SkillScore.findOne({ userId, topic });
    if (skillRecord) {
      skillScore = skillRecord.skillScore;
    }
    
    // RAG Pipeline with Reranking
    const rawChunks = await retrieveRelevantChunks(userId, topic, topic, 10);
    if (rawChunks.length > 0) {
      const topChunks = await rerankChunks(topic, rawChunks, 3);
      if (topChunks.length > 0) {
        context = `RETRIEVED CONTEXT FROM STUDENT'S NOTES:\n${'='.repeat(50)}\n${topChunks.map((c, i) => `[Context ${i + 1}]\n${c}`).join('\n\n---\n\n')}\n${'='.repeat(50)}\n\nAdditionally, use the student's own notes above to inform question generation. Prioritize concepts from their notes.`;
        ragEnhanced = true;
      }
    }
  }

  const difficulty = getDifficultyLabel(skillScore);
  const fewShotBlock = getFewShotBlock(examType);

  // Semantic Cache Check
  const cachePromptStr = `topic:${topic}|exam:${examType}|score:${skillScore}|rag:${ragEnhanced}|content:${content}`;
  const cachedMCQs = await checkSemanticCache(cachePromptStr, 0.95);
  
  if (cachedMCQs) {
    sendSuccess(res, {
      questions: cachedMCQs,
      sessionMeta: {
        topic,
        examType,
        skillScore,
        ragEnhanced,
        cached: true,
        generatedAt: new Date().toISOString(),
      },
    });
    return;
  }

  const input: MCQChainInput = {
    examType,
    topic,
    difficulty,
    skillScore,
    count,
    content,
    context,
    fewShotBlock,
  };

  // Generation
  let questions = await runMCQChain(input);

  // Self Eval & Quality Control
  questions = await filterAndRegenerateMCQs(questions, input);
  questions = await filterMCQOutput(questions, topic);

  // Ensure evaluation details are visible internally if needed, but questions is the final valid array
  const evals = await evaluateMCQBatch(questions, topic, examType);
  // Log issues to console (could send to APM in prod)
  evals.forEach(e => { if (!e.passed) console.warn(`MCQ Warning ID ${e.questionId}:`, e.issues); });

  // Store successful generation in cache
  await storeInCache(cachePromptStr, questions, 24);

  sendSuccess(res, {
    questions,
    sessionMeta: {
      topic,
      examType,
      skillScore,
      ragEnhanced,
      cached: false,
      generatedAt: new Date().toISOString(),
    },
  });
});

const analyzeWeakTopicsController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.body as WeakTopicsBody;

  if (!userId) {
    sendError(res, 'userId is required.', 400);
    return;
  }

  const skillScores = await SkillScore.find({ userId });

  if (skillScores.length === 0) {
    sendError(res, 'No skill score data found for this user. Practice some questions first.', 404);
    return;
  }

  const performanceSummary = skillScores
    .map(
      (entry) => {
        const total = entry.totalQuestions ?? 0;
        const correctCount = entry.correctCount ?? 0;
        const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        return `- ${entry.topic} > ${entry.subtopic || 'General'}: ${correctCount}/${total} correct (${pct}%)`;
      }
    )
    .join('\n');

  const input: WeakTopicChainInput = {
    performanceSummary,
    examType: 'BOTH' as 'JEE' | 'UPSC' | 'BOTH',
  };

  const analysis = await runWeakTopicChain(input);

  sendSuccess(res, analysis);
});

export { generateMCQsController, analyzeWeakTopicsController };

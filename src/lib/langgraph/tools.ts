import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import SkillScore from '../../models/SkillScore';
import Session from '../../models/Session';
import { buildRAGContext } from '../rag/ragPipeline';
import { runMCQChain, MCQChainInput } from '../langchain/chains';

// ---------- fetchSkillScoreTool ----------

export const fetchSkillScoreTool = new DynamicStructuredTool({
  name: 'fetchSkillScore',
  description: 'Fetches the skill score of a user for a specific topic.',
  schema: z.object({
    userId: z.string(),
    topic: z.string(),
  }),
  func: async ({ userId, topic }) => {
    const record = await SkillScore.findOne({ userId, topic });
    return String(record ? record.skillScore : 1200);
  },
});

// ---------- fetchWeakTopicsTool ----------

export const fetchWeakTopicsTool = new DynamicStructuredTool({
  name: 'fetchWeakTopics',
  description: 'Fetches the top N weakest topics for a user.',
  schema: z.object({
    userId: z.string(),
    topN: z.number(),
  }),
  func: async ({ userId, topN }) => {
    const scores = await SkillScore.find({ userId });
    const weakTopics = scores
      .filter((s) => s.totalQuestions > 0)
      .map((s) => ({
        topic: s.topic,
        subtopic: s.subtopic || 'General',
        accuracy: Math.round((s.correctCount / s.totalQuestions) * 100),
        skillScore: s.skillScore,
        totalQuestions: s.totalQuestions,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, topN);

    return JSON.stringify(weakTopics);
  },
});

// ---------- retrieveNotesTool ----------

export const retrieveNotesTool = new DynamicStructuredTool({
  name: 'retrieveNotes',
  description: 'Retrieves relevant context from a user\'s uploaded notes.',
  schema: z.object({
    userId: z.string(),
    topic: z.string(),
    query: z.string(),
  }),
  func: async ({ userId, topic, query }) => {
    const context = await buildRAGContext(userId, topic, query);
    return context || 'No notes found.';
  },
});

// ---------- generateMCQsTool ----------

export const generateMCQsTool = new DynamicStructuredTool({
  name: 'generateMCQs',
  description: 'Generates multiple choice questions based on provided parameters.',
  schema: z.object({
    content: z.string(),
    topic: z.string(),
    examType: z.string(),
    skillScore: z.number(),
    count: z.number(),
  }),
  func: async ({ content, topic, examType, skillScore, count }) => {
    let difficulty = 'Hard (advanced application, tricky distractors, exam-style)';
    if (skillScore < 1100) {
      difficulty = 'Easy (basic recall, direct application)';
    } else if (skillScore < 1300) {
      difficulty = 'Medium (multi-step reasoning, conceptual)';
    }

    const input: MCQChainInput = {
      examType,
      topic,
      difficulty,
      skillScore,
      count,
      content,
    };
    const questions = await runMCQChain(input);
    return JSON.stringify(questions);
  },
});

// ---------- saveSessionTool ----------

export const saveSessionTool = new DynamicStructuredTool({
  name: 'saveSession',
  description: 'Saves an exam session to the database.',
  schema: z.object({
    userId: z.string(),
    topic: z.string(),
    examType: z.string(),
    totalQuestions: z.number(),
    correctCount: z.number(),
    durationSeconds: z.number(),
  }),
  func: async ({ userId, topic, examType, totalQuestions, correctCount, durationSeconds }) => {
    const session = await Session.create({
      userId,
      topic,
      examType,
      totalQuestions,
      correctCount,
      durationSeconds,
    });
    return session._id.toString();
  },
});

// ---------- updateSkillScoreTool ----------

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

export const updateSkillScoreTool = new DynamicStructuredTool({
  name: 'updateSkillScore',
  description: 'Updates a user\'s skill score using the Elo rating system.',
  schema: z.object({
    userId: z.string(),
    topic: z.string(),
    isCorrect: z.boolean(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  }),
  func: async ({ userId, topic, isCorrect, difficulty }) => {
    let record = await SkillScore.findOne({ userId, topic, subtopic: 'General' });
    if (!record) {
      record = await SkillScore.create({
        userId,
        topic,
        subtopic: 'General',
        skillScore: 1200,
        totalQuestions: 0,
        correctCount: 0,
        lastPracticed: new Date(),
      });
    }

    const currentScore = record.skillScore;
    const questionElo = QUESTION_ELO[difficulty as Difficulty];
    const K = K_FACTORS[difficulty as Difficulty];

    const expected = 1 / (1 + Math.pow(10, (questionElo - currentScore) / 400));
    const actual = isCorrect ? 1 : 0;

    const newScore = clamp(
      Math.round(currentScore + K * (actual - expected)),
      600,
      2000
    );

    record.skillScore = newScore;
    record.totalQuestions += 1;
    if (isCorrect) record.correctCount += 1;
    record.lastPracticed = new Date();
    await record.save();

    return String(newScore);
  },
});

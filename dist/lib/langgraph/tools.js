"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSkillScoreTool = exports.saveSessionTool = exports.generateMCQsTool = exports.retrieveNotesTool = exports.fetchWeakTopicsTool = exports.fetchSkillScoreTool = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const SkillScore_1 = __importDefault(require("../../models/SkillScore"));
const Session_1 = __importDefault(require("../../models/Session"));
const ragPipeline_1 = require("../rag/ragPipeline");
const chains_1 = require("../langchain/chains");
// ---------- fetchSkillScoreTool ----------
exports.fetchSkillScoreTool = new tools_1.DynamicStructuredTool({
    name: 'fetchSkillScore',
    description: 'Fetches the skill score of a user for a specific topic.',
    schema: zod_1.z.object({
        userId: zod_1.z.string(),
        topic: zod_1.z.string(),
    }),
    func: async ({ userId, topic }) => {
        const record = await SkillScore_1.default.findOne({ userId, topic });
        return String(record ? record.skillScore : 1200);
    },
});
// ---------- fetchWeakTopicsTool ----------
exports.fetchWeakTopicsTool = new tools_1.DynamicStructuredTool({
    name: 'fetchWeakTopics',
    description: 'Fetches the top N weakest topics for a user.',
    schema: zod_1.z.object({
        userId: zod_1.z.string(),
        topN: zod_1.z.number(),
    }),
    func: async ({ userId, topN }) => {
        const scores = await SkillScore_1.default.find({ userId });
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
exports.retrieveNotesTool = new tools_1.DynamicStructuredTool({
    name: 'retrieveNotes',
    description: 'Retrieves relevant context from a user\'s uploaded notes.',
    schema: zod_1.z.object({
        userId: zod_1.z.string(),
        topic: zod_1.z.string(),
        query: zod_1.z.string(),
    }),
    func: async ({ userId, topic, query }) => {
        const context = await (0, ragPipeline_1.buildRAGContext)(userId, topic, query);
        return context || 'No notes found.';
    },
});
// ---------- generateMCQsTool ----------
exports.generateMCQsTool = new tools_1.DynamicStructuredTool({
    name: 'generateMCQs',
    description: 'Generates multiple choice questions based on provided parameters.',
    schema: zod_1.z.object({
        content: zod_1.z.string(),
        topic: zod_1.z.string(),
        examType: zod_1.z.string(),
        skillScore: zod_1.z.number(),
        count: zod_1.z.number(),
    }),
    func: async ({ content, topic, examType, skillScore, count }) => {
        let difficulty = 'Hard (advanced application, tricky distractors, exam-style)';
        if (skillScore < 1100) {
            difficulty = 'Easy (basic recall, direct application)';
        }
        else if (skillScore < 1300) {
            difficulty = 'Medium (multi-step reasoning, conceptual)';
        }
        const input = {
            examType,
            topic,
            difficulty,
            skillScore,
            count,
            content,
        };
        const questions = await (0, chains_1.runMCQChain)(input);
        return JSON.stringify(questions);
    },
});
// ---------- saveSessionTool ----------
exports.saveSessionTool = new tools_1.DynamicStructuredTool({
    name: 'saveSession',
    description: 'Saves an exam session to the database.',
    schema: zod_1.z.object({
        userId: zod_1.z.string(),
        topic: zod_1.z.string(),
        examType: zod_1.z.string(),
        totalQuestions: zod_1.z.number(),
        correctCount: zod_1.z.number(),
        durationSeconds: zod_1.z.number(),
    }),
    func: async ({ userId, topic, examType, totalQuestions, correctCount, durationSeconds }) => {
        const session = await Session_1.default.create({
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
const K_FACTORS = {
    Easy: 16,
    Medium: 24,
    Hard: 32,
};
const QUESTION_ELO = {
    Easy: 1000,
    Medium: 1200,
    Hard: 1500,
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
exports.updateSkillScoreTool = new tools_1.DynamicStructuredTool({
    name: 'updateSkillScore',
    description: 'Updates a user\'s skill score using the Elo rating system.',
    schema: zod_1.z.object({
        userId: zod_1.z.string(),
        topic: zod_1.z.string(),
        isCorrect: zod_1.z.boolean(),
        difficulty: zod_1.z.enum(['Easy', 'Medium', 'Hard']),
    }),
    func: async ({ userId, topic, isCorrect, difficulty }) => {
        let record = await SkillScore_1.default.findOne({ userId, topic, subtopic: 'General' });
        if (!record) {
            record = await SkillScore_1.default.create({
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
        const questionElo = QUESTION_ELO[difficulty];
        const K = K_FACTORS[difficulty];
        const expected = 1 / (1 + Math.pow(10, (questionElo - currentScore) / 400));
        const actual = isCorrect ? 1 : 0;
        const newScore = clamp(Math.round(currentScore + K * (actual - expected)), 600, 2000);
        record.skillScore = newScore;
        record.totalQuestions += 1;
        if (isCorrect)
            record.correctCount += 1;
        record.lastPracticed = new Date();
        await record.save();
        return String(newScore);
    },
});

"use strict";
// @ts-nocheck
/**
 * LangChain chains — composable prompt → LLM → parser pipelines.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStudyPlanChain = exports.runWeakTopicChain = exports.runExplanationChain = exports.runMCQChain = void 0;
const runnables_1 = require("@langchain/core/runnables");
const llm_1 = require("./llm");
const parsers_1 = require("./parsers");
const prompts_1 = require("./prompts");
// ---------- MCQ Chain ----------
const mcqChain = runnables_1.RunnableSequence.from([
    prompts_1.mcqPromptTemplate,
    llm_1.zeroTempLLM,
    parsers_1.mcqArrayParser,
]);
const runMCQChain = async (input) => {
    const result = await mcqChain.invoke({
        examType: input.examType,
        topic: input.topic,
        difficulty: input.difficulty,
        skillScore: String(input.skillScore),
        count: String(input.count),
        content: input.content,
        context: input.context || '',
        fewShotBlock: input.fewShotBlock || '',
    });
    return result;
};
exports.runMCQChain = runMCQChain;
// ---------- Explanation Chain ----------
const explanationChain = runnables_1.RunnableSequence.from([
    prompts_1.explanationPromptTemplate,
    llm_1.fastLLM,
    parsers_1.explanationParser,
]);
const runExplanationChain = async (input) => {
    const result = await explanationChain.invoke({
        question: input.question,
        optionA: input.optionA,
        optionB: input.optionB,
        optionC: input.optionC,
        optionD: input.optionD,
        correctOption: input.correctOption,
        studentAnswer: input.studentAnswer,
        isCorrect: input.isCorrect,
        examType: input.examType,
    });
    return result;
};
exports.runExplanationChain = runExplanationChain;
// ---------- Weak Topic Chain ----------
const weakTopicChain = runnables_1.RunnableSequence.from([
    prompts_1.weakTopicPromptTemplate,
    llm_1.llm,
    parsers_1.weakTopicParser,
]);
const runWeakTopicChain = async (input) => {
    const result = await weakTopicChain.invoke({
        performanceSummary: input.performanceSummary,
        examType: input.examType,
    });
    return result;
};
exports.runWeakTopicChain = runWeakTopicChain;
// ---------- Study Plan Chain ----------
const studyPlanChain = runnables_1.RunnableSequence.from([
    prompts_1.dailyStudyPlanTemplate,
    llm_1.llm,
    parsers_1.studyPlanParser,
]);
const runStudyPlanChain = async (input) => {
    const result = await studyPlanChain.invoke({
        weakTopics: input.weakTopics,
        availableMinutes: String(input.availableMinutes),
        examType: input.examType,
        targetYear: String(input.targetYear),
        formatInstructions: parsers_1.STUDY_PLAN_FORMAT_INSTRUCTIONS,
    });
    return result;
};
exports.runStudyPlanChain = runStudyPlanChain;

"use strict";
/**
 * LangChain output parsers — typed parsers for each chain's output format.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STUDY_PLAN_FORMAT_INSTRUCTIONS = exports.studyPlanParser = exports.explanationParser = exports.weakTopicParser = exports.mcqArrayParser = void 0;
const output_parsers_1 = require("@langchain/core/output_parsers");
// ---------- MCQ Array Parser ----------
const mcqArrayParser = new output_parsers_1.JsonOutputParser();
exports.mcqArrayParser = mcqArrayParser;
// ---------- Weak Topic Parser ----------
const weakTopicParser = new output_parsers_1.JsonOutputParser();
exports.weakTopicParser = weakTopicParser;
// ---------- Explanation Parser ----------
const explanationParser = new output_parsers_1.StringOutputParser();
exports.explanationParser = explanationParser;
const studyPlanParser = new output_parsers_1.JsonOutputParser();
exports.studyPlanParser = studyPlanParser;
const STUDY_PLAN_FORMAT_INSTRUCTIONS = `Return a valid JSON object with this exact structure (no markdown, no code fences):
{
  "dailyGoalMinutes": <number — target study time in minutes>,
  "topicsToday": [<string — list of topics to study today>],
  "tip": "<string — a specific, actionable study tip>",
  "motivationalNote": "<string — an encouraging message for the student>"
}`;
exports.STUDY_PLAN_FORMAT_INSTRUCTIONS = STUDY_PLAN_FORMAT_INSTRUCTIONS;

/**
 * LangChain output parsers — typed parsers for each chain's output format.
 */

import { JsonOutputParser, StringOutputParser } from '@langchain/core/output_parsers';
import { MCQQuestion, WeakTopicAnalysis } from '../../types/index';

// ---------- MCQ Array Parser ----------

const mcqArrayParser = new JsonOutputParser<MCQQuestion[]>();

// ---------- Weak Topic Parser ----------

const weakTopicParser = new JsonOutputParser<WeakTopicAnalysis>();

// ---------- Explanation Parser ----------

const explanationParser = new StringOutputParser();

// ---------- Study Plan ----------

export interface StudyPlan {
  dailyGoalMinutes: number;
  topicsToday: string[];
  tip: string;
  motivationalNote: string;
}

const studyPlanParser = new JsonOutputParser<StudyPlan>();

const STUDY_PLAN_FORMAT_INSTRUCTIONS = `Return a valid JSON object with this exact structure (no markdown, no code fences):
{
  "dailyGoalMinutes": <number — target study time in minutes>,
  "topicsToday": [<string — list of topics to study today>],
  "tip": "<string — a specific, actionable study tip>",
  "motivationalNote": "<string — an encouraging message for the student>"
}`;

export {
  mcqArrayParser,
  weakTopicParser,
  explanationParser,
  studyPlanParser,
  STUDY_PLAN_FORMAT_INSTRUCTIONS,
};


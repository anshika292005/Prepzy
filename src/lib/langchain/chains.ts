// @ts-nocheck
/**
 * LangChain chains — composable prompt → LLM → parser pipelines.
 */

import { RunnableSequence } from '@langchain/core/runnables';
import { llm, fastLLM, zeroTempLLM } from './llm';
import {
  mcqArrayParser,
  weakTopicParser,
  explanationParser,
  studyPlanParser,
  StudyPlan,
  STUDY_PLAN_FORMAT_INSTRUCTIONS,
} from './parsers';
import {
  mcqPromptTemplate,
  explanationPromptTemplate,
  weakTopicPromptTemplate,
  dailyStudyPlanTemplate,
} from './prompts';
import { MCQQuestion, WeakTopicAnalysis } from '../../types/index';

// ---------- Input Types ----------

export interface MCQChainInput {
  examType: string;
  topic: string;
  difficulty: string;
  skillScore: number;
  count: number;
  content: string;
  context?: string;
  fewShotBlock?: string;
}

export interface ExplanationChainInput {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  studentAnswer: string;
  isCorrect: string;
  examType: string;
}

export interface WeakTopicChainInput {
  performanceSummary: string;
  examType: string;
}

export interface StudyPlanChainInput {
  weakTopics: string;
  availableMinutes: number;
  examType: string;
  targetYear: number;
}

// ---------- MCQ Chain ----------

const mcqChain = RunnableSequence.from([
  mcqPromptTemplate,
  zeroTempLLM,
  mcqArrayParser,
]);

const runMCQChain = async (input: MCQChainInput): Promise<MCQQuestion[]> => {
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
  return result as MCQQuestion[];
};

// ---------- Explanation Chain ----------

const explanationChain = RunnableSequence.from([
  explanationPromptTemplate,
  fastLLM,
  explanationParser,
]);

const runExplanationChain = async (input: ExplanationChainInput): Promise<string> => {
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

// ---------- Weak Topic Chain ----------

const weakTopicChain = RunnableSequence.from([
  weakTopicPromptTemplate,
  llm,
  weakTopicParser,
]);

const runWeakTopicChain = async (input: WeakTopicChainInput): Promise<WeakTopicAnalysis> => {
  const result = await weakTopicChain.invoke({
    performanceSummary: input.performanceSummary,
    examType: input.examType,
  });
  return result as WeakTopicAnalysis;
};

// ---------- Study Plan Chain ----------

const studyPlanChain = RunnableSequence.from([
  dailyStudyPlanTemplate,
  llm,
  studyPlanParser,
]);

const runStudyPlanChain = async (input: StudyPlanChainInput): Promise<StudyPlan> => {
  const result = await studyPlanChain.invoke({
    weakTopics: input.weakTopics,
    availableMinutes: String(input.availableMinutes),
    examType: input.examType,
    targetYear: String(input.targetYear),
    formatInstructions: STUDY_PLAN_FORMAT_INSTRUCTIONS,
  });
  return result;
};

export {
  runMCQChain,
  runExplanationChain,
  runWeakTopicChain,
  runStudyPlanChain,
};

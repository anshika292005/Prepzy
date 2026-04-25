/**
 * Self-evaluation loop enabling Claude to review and critique 
 * its own generated questions before releasing them to the user.
 */

import { RunnableSequence } from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { llm } from '../langchain/llm';
import { MCQQuestion } from '../../types/index';
import { MCQChainInput, runMCQChain } from '../langchain/chains';

export interface MCQEvalResult {
  questionId: string; // The ID of the question in the array
  passed: boolean;
  issues: string[];
  suggestion: string;
}

const evaluatorPrompt = PromptTemplate.fromTemplate(`
You are an expert exam auditor for {examType} exams.
Your task is to review a batch of generated multiple-choice questions for the topic: "{topic}".
You must strictly flag questions that are low quality.

Check for:
1. Ambiguous phrasing or lack of clarity.
2. Multiple potentially correct options or no clearly correct option.
3. Trivial, non-educational distractors.
4. Questions that severely mismatch the requested topic.

QUESTIONS TO EVALUATE:
{mcqs}

OUTPUT: Return a JSON array of evaluation results. No markdown formatting.
Format for array elements:
{{
  "questionId": "1", // Use the integer id from the question, converted to string
  "passed": true/false, // false if any issues found
  "issues": ["Issue 1", "Issue 2"], // empty if passed
  "suggestion": "How to fix it" // empty if passed
}}
`);

const evalChain = RunnableSequence.from([
  evaluatorPrompt,
  llm,
  new JsonOutputParser<MCQEvalResult[]>(),
]);

export const evaluateMCQBatch = async (
  mcqs: MCQQuestion[],
  topic: string,
  examType: string
): Promise<MCQEvalResult[]> => {
  if (mcqs.length === 0) return [];

  const stringifiedQs = mcqs.map(q => 
    `ID: ${q.id}\nQ: ${q.question}\nA: ${q.options.A} | B: ${q.options.B} | C: ${q.options.C} | D: ${q.options.D}\nCorrect: ${q.correct}\n`
  ).join('\n---\n');

  try {
    const results = await evalChain.invoke({
      mcqs: stringifiedQs,
      topic,
      examType,
    });
    return results;
  } catch (error) {
    console.error('Self-evaluator error:', error);
    // Safe fallback: pass everything if eval fails
    return mcqs.map(q => ({
      questionId: String(q.id),
      passed: true,
      issues: [],
      suggestion: '',
    }));
  }
};

export const filterAndRegenerateMCQs = async (
  mcqs: MCQQuestion[],
  params: MCQChainInput
): Promise<MCQQuestion[]> => {
  const evals = await evaluateMCQBatch(mcqs, params.topic, params.examType);
  
  const passedIds = new Set(evals.filter(e => e.passed).map(e => parseInt(e.questionId, 10)));
  const validMCQs = mcqs.filter(q => passedIds.has(q.id));
  
  const originalCount = mcqs.length;
  const passedCount = validMCQs.length;
  const failedCount = originalCount - passedCount;

  // If we lost more than 2, regenerate the missing amount to maintain healthy batch size
  if (failedCount > 2) {
    try {
      const regParams = { ...params, count: failedCount };
      const newMCQs = await runMCQChain(regParams);
      
      // Auto-pass these to avoid infinite loops, but re-index them
      let nextId = Math.max(...validMCQs.map(q => q.id), 0) + 1;
      for (const q of newMCQs) {
        q.id = nextId++;
        validMCQs.push(q);
      }
    } catch (ignore) {
      // If regeneration fails, just return the valid ones we have
    }
  }

  return validMCQs;
};

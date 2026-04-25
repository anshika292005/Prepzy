// @ts-nocheck
/**
 * Streaming responses via Server-Sent Events (SSE) for better UX.
 */

import { Response } from 'express';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { MCQPromptParams } from '../prompts/mcqGenerator'; // Note: For params structure
import { ExplanationChainInput } from '../langchain/chains';
import { llm, fastLLM } from '../langchain/llm';
import { mcqPromptTemplate, explanationPromptTemplate } from '../langchain/prompts';
import { getFewShotBlock } from '../fewshot/fewShotExamples';

// Helper to write SSE events
const writeSSE = (res: Response, data: Record<string, unknown>) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

export const streamMCQGeneration = async (
  params: MCQPromptParams,
  res: Response
): Promise<void> => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.status(200);
  res.flushHeaders();

  try {
    let difficulty = 'Hard (advanced application, tricky distractors, exam-style)';
    if (params.skillScore < 1100) difficulty = 'Easy (basic recall, direct application)';
    else if (params.skillScore < 1300) difficulty = 'Medium (multi-step reasoning, conceptual)';

    const fewShotBlock = getFewShotBlock(params.examType as 'JEE' | 'UPSC' | 'BOTH');

    // Get the prompt value
    const promptValue = await mcqPromptTemplate.invoke({
      examType: params.examType,
      topic: params.topic,
      difficulty,
      skillScore: params.skillScore,
      count: params.count,
      content: params.content || '...',
      context: '', // Default empty if no rag
      fewShotBlock,
    });

    const stream = await llm.stream(promptValue);

    let fullResponse = '';

    for await (const chunk of stream) {
      if (chunk.content) {
        const textChunk = chunk.content.toString();
        fullResponse += textChunk;
        writeSSE(res, { token: textChunk, done: false });
      }
    }

    let parsed = [];
    try {
      parsed = JSON.parse(fullResponse);
    } catch {
      // Best effort parse
    }

    writeSSE(res, { done: true, questions: parsed });
  } catch (error) {
    console.error('Stream MCQ error:', error);
    writeSSE(res, { error: 'Failed to generate MCQs', done: true });
  } finally {
    res.end();
  }
};

export const streamExplanation = async (
  params: ExplanationChainInput,
  res: Response
): Promise<void> => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.status(200);
  res.flushHeaders();

  try {
    const promptValue = await explanationPromptTemplate.invoke(params);
    const stream = await fastLLM.stream(promptValue);

    let fullResponse = '';

    for await (const chunk of stream) {
      if (chunk.content) {
        const textChunk = chunk.content.toString();
        fullResponse += textChunk;
        writeSSE(res, { token: textChunk, done: false });
      }
    }

    writeSSE(res, { done: true, text: fullResponse });
  } catch (error) {
    console.error('Stream Explanation error:', error);
    writeSSE(res, { error: 'Failed to generate explanation', done: true });
  } finally {
    res.end();
  }
};

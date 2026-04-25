/**
 * Document relevance scoring using Claude.
 */

import { RunnableSequence } from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { fastLLM } from '../langchain/llm';

interface RerankerOutput {
  scores: number[];
}

const rerankerPrompt = PromptTemplate.fromTemplate(`
You are an expert document relevance scorer.
You will be given a QUERY and a list of CHUNKS of text.
Your job is to rate how relevant each chunk is to answering the QUERY.
Score each chunk on a scale from 0.0 (completely irrelevant) to 1.0 (highly relevant).

QUERY: {query}

CHUNKS:
{chunks}

OUTPUT: Return a JSON object exactly like this: {{ "scores": [0.8, 0.2, 0.9] }}
Output MUST be valid JSON. No markdown formatting.
`);

const rerankChain = RunnableSequence.from([
  rerankerPrompt,
  fastLLM,
  new JsonOutputParser<RerankerOutput>(),
]);

export const rerankChunks = async (
  query: string,
  chunks: string[],
  topN: number = 3
): Promise<string[]> => {
  if (chunks.length === 0) return [];
  if (chunks.length <= topN) return chunks; // No need to rerank if we already have topN or fewer

  const formattedChunks = chunks
    .map((chunk, index) => `[Chunk ${index}]\n${chunk}`)
    .join('\n\n');

  try {
    const result = await rerankChain.invoke({
      query,
      chunks: formattedChunks,
    });

    if (!result.scores || result.scores.length !== chunks.length) {
      // Fallback if Claude returns malformed arrays
      return chunks.slice(0, topN);
    }

    const scoredChunks = chunks.map((chunk, index) => ({
      chunk,
      score: result.scores[index] || 0,
    }));

    scoredChunks.sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, topN).map((sc) => sc.chunk);
  } catch (err) {
    console.error('Reranker error:', err);
    return chunks.slice(0, topN); // Safe fallback to first N
  }
};

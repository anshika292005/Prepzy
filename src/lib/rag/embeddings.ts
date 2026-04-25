/**
 * Embedding generation with caching and batch support.
 * Uses OpenAI text-embedding-3-small via API.
 */

import crypto from 'crypto';

// ---------- Types ----------

interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

// ---------- Cache ----------

const embeddingCache = new Map<string, number[]>();

const hashText = (text: string): string => {
  return crypto.createHash('md5').update(text).digest('hex');
};

// ---------- Single Embedding ----------

const generateEmbedding = async (text: string): Promise<number[]> => {
  const hash = hashText(text);
  const cached = embeddingCache.get(hash);
  if (cached) return cached;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set.');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI Embedding API error (${response.status}): ${errorBody}`);
  }

  const result = (await response.json()) as EmbeddingResponse;
  const embedding = result.data[0].embedding;

  embeddingCache.set(hash, embedding);
  return embedding;
};

// ---------- Batch Embeddings with Concurrency Limit ----------

const generateBatchEmbeddings = async (
  texts: string[],
  concurrencyLimit: number = 5
): Promise<number[][]> => {
  const results: number[][] = new Array(texts.length);
  let currentIndex = 0;

  const worker = async (): Promise<void> => {
    while (currentIndex < texts.length) {
      const idx = currentIndex;
      currentIndex++;
      results[idx] = await generateEmbedding(texts[idx]);
    }
  };

  const workers: Promise<void>[] = [];
  const workerCount = Math.min(concurrencyLimit, texts.length);
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
};

export { generateEmbedding, generateBatchEmbeddings };

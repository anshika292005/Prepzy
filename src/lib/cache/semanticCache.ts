/**
 * Semantic caching using ChromaDB to avoid redundant LLM calls
 * for highly similar prompts.
 */

import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
import { generateEmbedding } from '../rag/embeddings';
import { MCQQuestion } from '../../types/index';

// ---------- ChromaDB Client Setup ----------

const getChromaClient = (): ChromaClient => {
  const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
  return new ChromaClient({ path: chromaUrl });
};

// Similar to vectorStore, we bypass Chroma's embedding function because we generate locally
const noopEmbedder = {
  generate: async () => [[]],
};

const getCacheCollection = async (): Promise<Collection> => {
  const client = getChromaClient();
  return client.getOrCreateCollection({
    name: 'mcq_cache',
    embeddingFunction: noopEmbedder, // Use no-op, we provide embeddings explicitly
  });
};

// ---------- Exported Functions ----------

export const checkSemanticCache = async (
  prompt: string,
  threshold: number = 0.92
): Promise<MCQQuestion[] | null> => {
  try {
    const collection = await getCacheCollection();
    const queryEmbedding = await generateEmbedding(prompt);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 1,
      include: [IncludeEnum.Metadatas, IncludeEnum.Distances],
    });

    if (
      !results.distances ||
      !results.distances[0] ||
      results.distances[0].length === 0 ||
      results.distances[0][0] === null
    ) {
      return null;
    }

    // ChromaDB cosine distance: smaller means more similar. 
    // Assuming distance is returned, similarity = 1 - distance (approx)
    // If threshold is a similarity threshold like 0.92, we want distance < (1 - 0.92) = 0.08
    const distance = results.distances[0][0];
    const similarity = 1 - distance;

    if (similarity >= threshold) {
      const metadatas = results.metadatas![0];
      if (metadatas && metadatas[0]) {
        const metadata = metadatas[0];

        // Ensure it hasn't expired
        const expiresAt = metadata.expiresAt as number;
        if (Date.now() > expiresAt) {
          return null; // Expired cache entry, could prune later
        }

        const mcqsJson = metadata.mcqs as string;
        try {
          return JSON.parse(mcqsJson) as MCQQuestion[];
        } catch {
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Semantic Cache error:', error);
    return null; // Fallback to normal generation on cache error
  }
};

export const storeInCache = async (
  prompt: string,
  mcqs: MCQQuestion[],
  ttlHours: number = 24
): Promise<void> => {
  try {
    const collection = await getCacheCollection();
    const embedding = await generateEmbedding(prompt);

    const id = `cache_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const expiresAt = Date.now() + ttlHours * 60 * 60 * 1000;

    await collection.upsert({
      ids: [id],
      embeddings: [embedding],
      metadatas: [
        {
          mcqs: JSON.stringify(mcqs),
          expiresAt,
        },
      ],
    });
  } catch (error) {
    console.error('Semantic Cache store error:', error);
  }
};

export const pruneExpiredCache = async (): Promise<void> => {
  try {
    const collection = await getCacheCollection();

    // In a production setup, it's better to use ChromaDB where filter
    // Currently, basic Chroma filter might struggle with numeric ranges,
    // so we fetch metadatas, find expired IDs, and delete them.
    const allDocs = await collection.get({
      include: [IncludeEnum.Metadatas],
    });

    if (!allDocs.metadatas) return;

    const expiredIds: string[] = [];
    const now = Date.now();

    for (let i = 0; i < allDocs.metadatas.length; i++) {
      const meta = allDocs.metadatas[i];
      if (meta && typeof meta.expiresAt === 'number' && meta.expiresAt < now) {
        expiredIds.push(allDocs.ids[i]);
      }
    }

    if (expiredIds.length > 0) {
      await collection.delete({ ids: expiredIds });
    }
  } catch (error) {
    console.error('Semantic Cache prune error:', error);
  }
};

/**
 * ChromaDB vector store integration for student notes.
 * Each user gets a dedicated collection: student_{userId}
 *
 * We supply our own embeddings (via OpenAI), so we use a no-op
 * embedding function when obtaining collection handles.
 */

import { ChromaClient, Collection, IEmbeddingFunction, IncludeEnum } from 'chromadb';
import { generateEmbedding } from './embeddings';

// ---------- No-op Embedding Function ----------

/** ChromaDB requires an IEmbeddingFunction, but we manage embeddings ourselves. */
class NoopEmbeddingFunction implements IEmbeddingFunction {
  async generate(texts: string[]): Promise<number[][]> {
    // Return zero-length vectors — we always supply our own embeddings.
    return texts.map(() => []);
  }
}

const noopEmbedder = new NoopEmbeddingFunction();

// ---------- Client ----------

const getChromaClient = (): ChromaClient => {
  const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
  return new ChromaClient({ path: chromaUrl });
};

const getCollectionName = (userId: string): string => {
  // ChromaDB collection names: 3-63 chars, alphanumeric + underscores/hyphens
  return `student_${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
};

const getOrCreateCollection = async (userId: string): Promise<Collection> => {
  const client = getChromaClient();
  const collectionName = getCollectionName(userId);
  return client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: noopEmbedder,
  });
};

const getExistingCollection = async (
  client: ChromaClient,
  collectionName: string
): Promise<Collection> => {
  return client.getCollection({
    name: collectionName,
    embeddingFunction: noopEmbedder,
  });
};

// ---------- Store ----------

const storeUserNotes = async (
  userId: string,
  topic: string,
  chunks: string[],
  embeddings: number[][]
): Promise<void> => {
  const collection = await getOrCreateCollection(userId);

  const ids = chunks.map((_, index) => `${userId}_${topic}_chunk_${index}`);
  const metadatas = chunks.map((_, index) => ({
    topic,
    userId,
    chunkIndex: index,
    storedAt: new Date().toISOString(),
  }));

  await collection.upsert({
    ids,
    embeddings,
    documents: chunks,
    metadatas,
  });
};

// ---------- Retrieve ----------

const retrieveRelevantChunks = async (
  userId: string,
  query: string,
  topic: string,
  nResults: number = 5
): Promise<string[]> => {
  const client = getChromaClient();
  const collectionName = getCollectionName(userId);

  let collection: Collection;
  try {
    collection = await getExistingCollection(client, collectionName);
  } catch {
    // Collection doesn't exist — no notes uploaded yet
    return [];
  }

  const queryEmbedding = await generateEmbedding(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
    where: { topic },
    include: [IncludeEnum.Documents],
  });

  if (!results.documents || !results.documents[0]) {
    return [];
  }

  return results.documents[0].filter((doc): doc is string => doc !== null);
};

// ---------- Delete ----------

const deleteUserNotes = async (
  userId: string,
  topic?: string
): Promise<void> => {
  const client = getChromaClient();
  const collectionName = getCollectionName(userId);

  if (!topic) {
    // Delete the entire collection
    try {
      await client.deleteCollection({ name: collectionName });
    } catch {
      // Collection may not exist — that's fine
    }
    return;
  }

  // Delete only chunks matching the topic
  let collection: Collection;
  try {
    collection = await getExistingCollection(client, collectionName);
  } catch {
    return;
  }

  // Get IDs of chunks with this topic, then delete them
  const existing = await collection.get({
    where: { topic },
    include: [],
  });

  if (existing.ids.length > 0) {
    await collection.delete({ ids: existing.ids });
  }
};

// ---------- List Topics ----------

const listUserTopics = async (userId: string): Promise<string[]> => {
  const client = getChromaClient();
  const collectionName = getCollectionName(userId);

  let collection: Collection;
  try {
    collection = await getExistingCollection(client, collectionName);
  } catch {
    return [];
  }

  const allDocs = await collection.get({
    include: [IncludeEnum.Metadatas],
  });

  if (!allDocs.metadatas) {
    return [];
  }

  const topicSet = new Set<string>();
  for (const metadata of allDocs.metadatas) {
    if (metadata && typeof metadata.topic === 'string') {
      topicSet.add(metadata.topic);
    }
  }

  return Array.from(topicSet).sort();
};

export { storeUserNotes, retrieveRelevantChunks, deleteUserNotes, listUserTopics };

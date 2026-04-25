/**
 * RAG pipeline orchestrator.
 * Ties together file processing, chunking, embedding, and vector storage
 * to provide context-enhanced MCQ generation.
 */

import { chunkText, cleanText } from './chunker';
import { generateBatchEmbeddings } from './embeddings';
import { storeUserNotes, retrieveRelevantChunks } from './vectorStore';
import { processUpload } from './fileProcessor';

// ---------- Ingest ----------

const ingestNotes = async (
  userId: string,
  topic: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ chunksStored: number }> => {
  // Step 1: Extract text from uploaded file
  const rawText = await processUpload(buffer, mimeType);

  // Step 2: Clean the extracted text
  const cleaned = cleanText(rawText);

  if (cleaned.length === 0) {
    throw new Error('No usable text could be extracted from the uploaded file.');
  }

  // Step 3: Chunk the text
  const chunks = chunkText(cleaned, 500, 50);

  if (chunks.length === 0) {
    throw new Error('Text chunking produced no chunks.');
  }

  // Step 4: Generate embeddings for all chunks
  const embeddings = await generateBatchEmbeddings(chunks);

  // Step 5: Store in ChromaDB
  await storeUserNotes(userId, topic, chunks, embeddings);

  return { chunksStored: chunks.length };
};

// ---------- Retrieve & Format Context ----------

const buildRAGContext = async (
  userId: string,
  topic: string,
  query: string
): Promise<string> => {
  const chunks = await retrieveRelevantChunks(userId, query, topic, 5);

  if (chunks.length === 0) {
    return '';
  }

  const formattedChunks = chunks
    .map((chunk, index) => `[Context ${index + 1}]\n${chunk}`)
    .join('\n\n---\n\n');

  return `RETRIEVED CONTEXT FROM STUDENT'S NOTES:\n${'='.repeat(50)}\n${formattedChunks}\n${'='.repeat(50)}`;
};

export { ingestNotes, buildRAGContext };

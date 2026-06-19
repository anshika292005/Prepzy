"use strict";
/**
 * RAG pipeline orchestrator.
 * Ties together file processing, chunking, embedding, and vector storage
 * to provide context-enhanced MCQ generation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRAGContext = exports.ingestNotes = void 0;
const chunker_1 = require("./chunker");
const embeddings_1 = require("./embeddings");
const vectorStore_1 = require("./vectorStore");
const fileProcessor_1 = require("./fileProcessor");
// ---------- Ingest ----------
const ingestNotes = async (userId, topic, buffer, mimeType) => {
    // Step 1: Extract text from uploaded file
    const rawText = await (0, fileProcessor_1.processUpload)(buffer, mimeType);
    // Step 2: Clean the extracted text
    const cleaned = (0, chunker_1.cleanText)(rawText);
    if (cleaned.length === 0) {
        throw new Error('No usable text could be extracted from the uploaded file.');
    }
    // Step 3: Chunk the text
    const chunks = (0, chunker_1.chunkText)(cleaned, 500, 50);
    if (chunks.length === 0) {
        throw new Error('Text chunking produced no chunks.');
    }
    // Step 4: Generate embeddings for all chunks
    const embeddings = await (0, embeddings_1.generateBatchEmbeddings)(chunks);
    // Step 5: Store in ChromaDB
    await (0, vectorStore_1.storeUserNotes)(userId, topic, chunks, embeddings);
    return { chunksStored: chunks.length };
};
exports.ingestNotes = ingestNotes;
// ---------- Retrieve & Format Context ----------
const buildRAGContext = async (userId, topic, query) => {
    const chunks = await (0, vectorStore_1.retrieveRelevantChunks)(userId, query, topic, 5);
    if (chunks.length === 0) {
        return '';
    }
    const formattedChunks = chunks
        .map((chunk, index) => `[Context ${index + 1}]\n${chunk}`)
        .join('\n\n---\n\n');
    return `RETRIEVED CONTEXT FROM STUDENT'S NOTES:\n${'='.repeat(50)}\n${formattedChunks}\n${'='.repeat(50)}`;
};
exports.buildRAGContext = buildRAGContext;

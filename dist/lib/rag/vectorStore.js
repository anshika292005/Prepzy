"use strict";
/**
 * ChromaDB vector store integration for student notes.
 * Each user gets a dedicated collection: student_{userId}
 *
 * We supply our own embeddings (via OpenAI), so we use a no-op
 * embedding function when obtaining collection handles.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUserTopics = exports.deleteUserNotes = exports.retrieveRelevantChunks = exports.storeUserNotes = void 0;
const chromadb_1 = require("chromadb");
const embeddings_1 = require("./embeddings");
// ---------- No-op Embedding Function ----------
/** ChromaDB requires an IEmbeddingFunction, but we manage embeddings ourselves. */
class NoopEmbeddingFunction {
    async generate(texts) {
        // Return zero-length vectors — we always supply our own embeddings.
        return texts.map(() => []);
    }
}
const noopEmbedder = new NoopEmbeddingFunction();
// ---------- Client ----------
const getChromaClient = () => {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    return new chromadb_1.ChromaClient({ path: chromaUrl });
};
const getCollectionName = (userId) => {
    // ChromaDB collection names: 3-63 chars, alphanumeric + underscores/hyphens
    return `student_${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
};
const getOrCreateCollection = async (userId) => {
    const client = getChromaClient();
    const collectionName = getCollectionName(userId);
    return client.getOrCreateCollection({
        name: collectionName,
        embeddingFunction: noopEmbedder,
    });
};
const getExistingCollection = async (client, collectionName) => {
    return client.getCollection({
        name: collectionName,
        embeddingFunction: noopEmbedder,
    });
};
// ---------- Store ----------
const storeUserNotes = async (userId, topic, chunks, embeddings) => {
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
exports.storeUserNotes = storeUserNotes;
// ---------- Retrieve ----------
const retrieveRelevantChunks = async (userId, query, topic, nResults = 5) => {
    const client = getChromaClient();
    const collectionName = getCollectionName(userId);
    let collection;
    try {
        collection = await getExistingCollection(client, collectionName);
    }
    catch (_a) {
        // Collection doesn't exist — no notes uploaded yet
        return [];
    }
    const queryEmbedding = await (0, embeddings_1.generateEmbedding)(query);
    const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults,
        where: { topic },
        include: [chromadb_1.IncludeEnum.Documents],
    });
    if (!results.documents || !results.documents[0]) {
        return [];
    }
    return results.documents[0].filter((doc) => doc !== null);
};
exports.retrieveRelevantChunks = retrieveRelevantChunks;
// ---------- Delete ----------
const deleteUserNotes = async (userId, topic) => {
    const client = getChromaClient();
    const collectionName = getCollectionName(userId);
    if (!topic) {
        // Delete the entire collection
        try {
            await client.deleteCollection({ name: collectionName });
        }
        catch (_a) {
            // Collection may not exist — that's fine
        }
        return;
    }
    // Delete only chunks matching the topic
    let collection;
    try {
        collection = await getExistingCollection(client, collectionName);
    }
    catch (_b) {
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
exports.deleteUserNotes = deleteUserNotes;
// ---------- List Topics ----------
const listUserTopics = async (userId) => {
    const client = getChromaClient();
    const collectionName = getCollectionName(userId);
    let collection;
    try {
        collection = await getExistingCollection(client, collectionName);
    }
    catch (_a) {
        return [];
    }
    const allDocs = await collection.get({
        include: [chromadb_1.IncludeEnum.Metadatas],
    });
    if (!allDocs.metadatas) {
        return [];
    }
    const topicSet = new Set();
    for (const metadata of allDocs.metadatas) {
        if (metadata && typeof metadata.topic === 'string') {
            topicSet.add(metadata.topic);
        }
    }
    return Array.from(topicSet).sort();
};
exports.listUserTopics = listUserTopics;

"use strict";
/**
 * Embedding generation with caching and batch support.
 * Uses OpenAI text-embedding-3-small via API.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBatchEmbeddings = exports.generateEmbedding = void 0;
const crypto_1 = __importDefault(require("crypto"));
// ---------- Cache ----------
const embeddingCache = new Map();
const hashText = (text) => {
    return crypto_1.default.createHash('md5').update(text).digest('hex');
};
// ---------- Single Embedding ----------
const generateEmbedding = async (text) => {
    const hash = hashText(text);
    const cached = embeddingCache.get(hash);
    if (cached)
        return cached;
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
    const result = (await response.json());
    const embedding = result.data[0].embedding;
    embeddingCache.set(hash, embedding);
    return embedding;
};
exports.generateEmbedding = generateEmbedding;
// ---------- Batch Embeddings with Concurrency Limit ----------
const generateBatchEmbeddings = async (texts, concurrencyLimit = 5) => {
    const results = new Array(texts.length);
    let currentIndex = 0;
    const worker = async () => {
        while (currentIndex < texts.length) {
            const idx = currentIndex;
            currentIndex++;
            results[idx] = await generateEmbedding(texts[idx]);
        }
    };
    const workers = [];
    const workerCount = Math.min(concurrencyLimit, texts.length);
    for (let i = 0; i < workerCount; i++) {
        workers.push(worker());
    }
    await Promise.all(workers);
    return results;
};
exports.generateBatchEmbeddings = generateBatchEmbeddings;

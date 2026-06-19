"use strict";
/**
 * Session-scoped conversation memory for follow-up explanations.
 *
 * In-memory store — resets on server restart.
 * For production, replace with Redis-backed or DB-backed memory.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateMemory = exports.createSessionMemory = exports.sessionMemoryStore = void 0;
const memory_1 = require("langchain/memory");
// ---------- Memory Store ----------
const sessionMemoryStore = new Map();
exports.sessionMemoryStore = sessionMemoryStore;
// ---------- Factory ----------
const createSessionMemory = () => {
    return new memory_1.BufferWindowMemory({
        k: 10,
        memoryKey: 'history',
        returnMessages: true,
        inputKey: 'input',
        outputKey: 'output',
    });
};
exports.createSessionMemory = createSessionMemory;
// ---------- Get or Create ----------
const getOrCreateMemory = (sessionId) => {
    const existing = sessionMemoryStore.get(sessionId);
    if (existing) {
        return existing;
    }
    const memory = createSessionMemory();
    sessionMemoryStore.set(sessionId, memory);
    return memory;
};
exports.getOrCreateMemory = getOrCreateMemory;

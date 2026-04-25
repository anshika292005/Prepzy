/**
 * Session-scoped conversation memory for follow-up explanations.
 *
 * In-memory store — resets on server restart.
 * For production, replace with Redis-backed or DB-backed memory.
 */

import { BufferWindowMemory } from 'langchain/memory';

// ---------- Memory Store ----------

const sessionMemoryStore = new Map<string, BufferWindowMemory>();

// ---------- Factory ----------

const createSessionMemory = (): BufferWindowMemory => {
  return new BufferWindowMemory({
    k: 10,
    memoryKey: 'history',
    returnMessages: true,
    inputKey: 'input',
    outputKey: 'output',
  });
};

// ---------- Get or Create ----------

const getOrCreateMemory = (sessionId: string): BufferWindowMemory => {
  const existing = sessionMemoryStore.get(sessionId);
  if (existing) {
    return existing;
  }

  const memory = createSessionMemory();
  sessionMemoryStore.set(sessionId, memory);
  return memory;
};

export {
  sessionMemoryStore,
  createSessionMemory,
  getOrCreateMemory,
};

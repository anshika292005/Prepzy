/**
 * LangChain LLM instances — shared across all chains.
 *
 * Three tiers using Groq for blazing fast inference:
 * - llm:          llama-3.3-70b-versatile (temp 0.7)
 * - fastLLM:      mixtral-8x7b-32768 or llama3-8b-8192 for lightweight tasks
 * - zeroTempLLM:  llama-3.3-70b-versatile for structured JSON output (temp 0)
 */

import { ChatGroq } from '@langchain/groq';

const llm = new ChatGroq({
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,
  maxTokens: 4096,
  apiKey: process.env.GROQ_API_KEY,
});

const fastLLM = new ChatGroq({
  model: 'llama3-8b-8192',
  temperature: 0.7,
  maxTokens: 2048,
  apiKey: process.env.GROQ_API_KEY,
});

const zeroTempLLM = new ChatGroq({
  model: 'llama-3.3-70b-versatile',
  temperature: 0,
  maxTokens: 4096,
  apiKey: process.env.GROQ_API_KEY,
});

export { llm, fastLLM, zeroTempLLM };

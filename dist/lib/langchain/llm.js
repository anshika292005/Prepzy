"use strict";
/**
 * LangChain LLM instances — shared across all chains.
 *
 * Three tiers using Groq for blazing fast inference:
 * - llm:          llama-3.3-70b-versatile (temp 0.7)
 * - fastLLM:      mixtral-8x7b-32768 or llama3-8b-8192 for lightweight tasks
 * - zeroTempLLM:  llama-3.3-70b-versatile for structured JSON output (temp 0)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.zeroTempLLM = exports.fastLLM = exports.llm = void 0;
const groq_1 = require("@langchain/groq");
const llm = new groq_1.ChatGroq({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    maxTokens: 4096,
    apiKey: process.env.GROQ_API_KEY,
});
exports.llm = llm;
const fastLLM = new groq_1.ChatGroq({
    model: 'llama3-8b-8192',
    temperature: 0.7,
    maxTokens: 2048,
    apiKey: process.env.GROQ_API_KEY,
});
exports.fastLLM = fastLLM;
const zeroTempLLM = new groq_1.ChatGroq({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    maxTokens: 4096,
    apiKey: process.env.GROQ_API_KEY,
});
exports.zeroTempLLM = zeroTempLLM;

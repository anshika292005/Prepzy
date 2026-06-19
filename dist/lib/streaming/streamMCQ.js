"use strict";
// @ts-nocheck
/**
 * Streaming responses via Server-Sent Events (SSE) for better UX.
 */
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamExplanation = exports.streamMCQGeneration = void 0;
const llm_1 = require("../langchain/llm");
const prompts_1 = require("../langchain/prompts");
const fewShotExamples_1 = require("../fewshot/fewShotExamples");
// Helper to write SSE events
const writeSSE = (res, data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
};
const streamMCQGeneration = async (params, res) => {
    var _a, e_1, _b, _c;
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });
    res.status(200);
    res.flushHeaders();
    try {
        let difficulty = 'Hard (advanced application, tricky distractors, exam-style)';
        if (params.skillScore < 1100)
            difficulty = 'Easy (basic recall, direct application)';
        else if (params.skillScore < 1300)
            difficulty = 'Medium (multi-step reasoning, conceptual)';
        const fewShotBlock = (0, fewShotExamples_1.getFewShotBlock)(params.examType);
        // Get the prompt value
        const promptValue = await prompts_1.mcqPromptTemplate.invoke({
            examType: params.examType,
            topic: params.topic,
            difficulty,
            skillScore: params.skillScore,
            count: params.count,
            content: params.content || '...',
            context: '', // Default empty if no rag
            fewShotBlock,
        });
        const stream = await llm_1.llm.stream(promptValue);
        let fullResponse = '';
        try {
            for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                _c = stream_1_1.value;
                _d = false;
                const chunk = _c;
                if (chunk.content) {
                    const textChunk = chunk.content.toString();
                    fullResponse += textChunk;
                    writeSSE(res, { token: textChunk, done: false });
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = stream_1.return)) await _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        let parsed = [];
        try {
            parsed = JSON.parse(fullResponse);
        }
        catch (_e) {
            // Best effort parse
        }
        writeSSE(res, { done: true, questions: parsed });
    }
    catch (error) {
        console.error('Stream MCQ error:', error);
        writeSSE(res, { error: 'Failed to generate MCQs', done: true });
    }
    finally {
        res.end();
    }
};
exports.streamMCQGeneration = streamMCQGeneration;
const streamExplanation = async (params, res) => {
    var _a, e_2, _b, _c;
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });
    res.status(200);
    res.flushHeaders();
    try {
        const promptValue = await prompts_1.explanationPromptTemplate.invoke(params);
        const stream = await llm_1.fastLLM.stream(promptValue);
        let fullResponse = '';
        try {
            for (var _d = true, stream_2 = __asyncValues(stream), stream_2_1; stream_2_1 = await stream_2.next(), _a = stream_2_1.done, !_a; _d = true) {
                _c = stream_2_1.value;
                _d = false;
                const chunk = _c;
                if (chunk.content) {
                    const textChunk = chunk.content.toString();
                    fullResponse += textChunk;
                    writeSSE(res, { token: textChunk, done: false });
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = stream_2.return)) await _b.call(stream_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        writeSSE(res, { done: true, text: fullResponse });
    }
    catch (error) {
        console.error('Stream Explanation error:', error);
        writeSSE(res, { error: 'Failed to generate explanation', done: true });
    }
    finally {
        res.end();
    }
};
exports.streamExplanation = streamExplanation;

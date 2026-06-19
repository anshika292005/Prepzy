"use strict";
/**
 * Prepzy — ML Service Client
 * ===========================
 * Thin HTTP client that Prepzy's existing Node controllers use to
 * call the Python FastAPI ML microservice.
 *
 * Drop this file at:  src/lib/mlClient.ts
 *
 * Usage example (from any controller):
 *   import mlClient from '../lib/mlClient';
 *   const report = await mlClient.getTopicPredictions(userId, topicData, skillScores);
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const Session_1 = __importDefault(require("../models/Session"));
const SkillScore_1 = __importDefault(require("../models/SkillScore"));
// ─────────────────────────────────────────────
// Client class
// ─────────────────────────────────────────────
class MLServiceClient {
    constructor() {
        var _a;
        const baseURL = (_a = process.env.ML_SERVICE_URL) !== null && _a !== void 0 ? _a : 'http://localhost:8080';
        this.http = axios_1.default.create({
            baseURL,
            timeout: 30000, // 30s — ML inference can be slow on first request
            headers: { 'Content-Type': 'application/json' },
        });
        // Log ML service errors clearly
        this.http.interceptors.response.use(res => res, err => {
            var _a, _b, _c, _d, _e;
            const status = (_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : 'N/A';
            const detail = (_e = (_d = (_c = err.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.detail) !== null && _e !== void 0 ? _e : err.message;
            console.error(`[ML Service] HTTP ${status}: ${detail}`);
            throw err;
        });
    }
    // ── 1. Analytics ───────────────────────────────────────────
    /**
     * Fetches topic data from existing MongoDB, formats it, and sends
     * to the Python ML service for full analytics computation.
     *
     * Automatically reads from Prepzy's Session + SkillScore models.
     * You only need to pass userId.
     */
    async getTopicPredictions(userId) {
        var _a;
        // Aggregate sessions by topic + year (from existing MongoDB)
        const raw = await Session_1.default.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: { topic: '$topic', year: { $year: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
        ]);
        // Pivot to per-topic yearly frequency
        const topicMap = {};
        for (const row of raw) {
            const { topic, year } = row._id;
            if (!topicMap[topic])
                topicMap[topic] = {};
            topicMap[topic][year] = ((_a = topicMap[topic][year]) !== null && _a !== void 0 ? _a : 0) + row.count;
        }
        const topics = Object.entries(topicMap).map(([topic, yearly_frequency]) => ({ topic, yearly_frequency }));
        // Fetch skill scores
        const skillDocs = await SkillScore_1.default.find({ userId }).lean();
        const skill_scores = skillDocs.map((s) => {
            var _a;
            return ({
                topic: s.topic,
                skill_score: (_a = s.skillScore) !== null && _a !== void 0 ? _a : 1200,
            });
        });
        const response = await this.http.post('/analytics/predict', {
            user_id: userId,
            topics,
            skill_scores,
        });
        return response.data;
    }
    // ── 2. Deduplication ───────────────────────────────────────
    async deduplicateQuestions(questions, options = {}) {
        var _a, _b;
        const response = await this.http.post('/deduplication/check', {
            questions,
            use_llm: (_a = options.useLLM) !== null && _a !== void 0 ? _a : true,
            similarity_threshold: (_b = options.similarityThreshold) !== null && _b !== void 0 ? _b : 0.85,
            borderline_low: 0.60,
        });
        return response.data;
    }
    // ── 3. Image Preprocessing ─────────────────────────────────
    async preprocessImage(imageBuffer, mimeType, options = {}) {
        var _a, _b, _c;
        const form = new form_data_1.default();
        form.append('file', imageBuffer, {
            filename: 'image.png',
            contentType: mimeType,
        });
        form.append('max_width', String((_a = options.maxWidth) !== null && _a !== void 0 ? _a : 2000));
        form.append('clip_limit', String((_b = options.clipLimit) !== null && _b !== void 0 ? _b : 3.0));
        form.append('run_deskew', String((_c = options.runDeskew) !== null && _c !== void 0 ? _c : true));
        const response = await this.http.post('/ocr/preprocess', form, { headers: form.getHeaders(), timeout: 60000 });
        return response.data.data;
    }
    // ── 4. Health check ────────────────────────────────────────
    async isHealthy() {
        var _a;
        try {
            const res = await this.http.get('/health', { timeout: 5000 });
            return ((_a = res.data) === null || _a === void 0 ? void 0 : _a.status) === 'ok';
        }
        catch (_b) {
            return false;
        }
    }
}
// Export singleton (Node.js module cache makes this effectively a singleton)
exports.default = new MLServiceClient();

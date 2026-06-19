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

import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import Session from '../models/Session';
import SkillScore from '../models/SkillScore';

// ─────────────────────────────────────────────
// Types (mirrors Python Pydantic schemas)
// ─────────────────────────────────────────────

export interface TopicYearEntry {
  topic: string;
  yearly_frequency: Record<number, number>;
}

export interface SkillWeightEntry {
  topic: string;
  skill_score: number;
}

export interface PredictionScore {
  topic: string;
  score: number;
  label: 'Very Likely' | 'Likely' | 'Possible' | 'Unlikely';
  breakdown: {
    frequency_score: number;
    trend_score: number;
    recency_score: number;
    gap_score: number;
    skill_weight_score: number;
  };
}

export interface TrendResult {
  topic: string;
  slope: number;
  direction: 'rising' | 'falling' | 'stable';
  r_squared: number;
}

export interface AnalyticsReport {
  user_id: string;
  generated_at: string;
  predictions: PredictionScore[];
  trends: TrendResult[];
  stabilities: Array<{ topic: string; std_dev: number; is_stable: boolean }>;
  cyclic_topics: Array<{
    topic: string;
    is_cyclic: boolean;
    cycle_length: number | null;
    acf_values: number[];
  }>;
  gap_analysis: Array<{
    topic: string;
    last_seen_year: number | null;
    gap_years: number;
    boost_multiplier: number;
  }>;
}

export interface DuplicatePair {
  question_a: { id: string; question_text: string; topic: string };
  question_b: { id: string; question_text: string; topic: string };
  cosine_similarity: number;
  llm_confirmed: boolean | null;
  is_duplicate: boolean;
}

export interface DeduplicationResult {
  original_count: number;
  unique_count: number;
  duplicate_count: number;
  duplicate_pairs: DuplicatePair[];
  unique_questions: Array<{ id: string; question_text: string; topic: string }>;
}

export interface PreprocessResult {
  quality_before: { score: number; recommendation: string };
  preprocess_steps: string[];
  original_size: { width: number; height: number };
  processed_size: { width: number; height: number };
  processed_image_base64: string;
}

// ─────────────────────────────────────────────
// Client class
// ─────────────────────────────────────────────

class MLServiceClient {
  private http: AxiosInstance;

  constructor() {
    const baseURL = process.env.ML_SERVICE_URL ?? 'http://ml_service:8080';
    this.http = axios.create({
      baseURL,
      timeout: 30_000,   // 30s — ML inference can be slow on first request
      headers: { 'Content-Type': 'application/json' },
    });

    // Log ML service errors clearly
    this.http.interceptors.response.use(
      res => res,
      err => {
        const status = err.response?.status ?? 'N/A';
        const detail = err.response?.data?.detail ?? err.message;
        console.error(`[ML Service] HTTP ${status}: ${detail}`);
        throw err;
      }
    );
  }

  // ── 1. Analytics ───────────────────────────────────────────

  /**
   * Fetches topic data from existing MongoDB, formats it, and sends
   * to the Python ML service for full analytics computation.
   *
   * Automatically reads from Prepzy's Session + SkillScore models.
   * You only need to pass userId.
   */
  async getTopicPredictions(userId: string): Promise<AnalyticsReport> {
    // Aggregate sessions by topic + year (from existing MongoDB)
    const raw = await (Session as any).aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { topic: '$topic', year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]);

    // Pivot to per-topic yearly frequency
    const topicMap: Record<string, Record<number, number>> = {};
    for (const row of raw) {
      const { topic, year } = row._id;
      if (!topicMap[topic]) topicMap[topic] = {};
      topicMap[topic][year] = (topicMap[topic][year] ?? 0) + row.count;
    }

    const topics: TopicYearEntry[] = Object.entries(topicMap).map(
      ([topic, yearly_frequency]) => ({ topic, yearly_frequency })
    );

    // Fetch skill scores
    const skillDocs = await SkillScore.find({ userId }).lean();
    const skill_scores: SkillWeightEntry[] = skillDocs.map(s => ({
      topic: s.topic,
      skill_score: s.skillScore ?? 1200,
    }));

    const response = await this.http.post<AnalyticsReport>('/analytics/predict', {
      user_id: userId,
      topics,
      skill_scores,
    });

    return response.data;
  }

  // ── 2. Deduplication ───────────────────────────────────────

  async deduplicateQuestions(
    questions: Array<{ id: string; question_text: string; topic: string; year?: number }>,
    options: { useLLM?: boolean; similarityThreshold?: number } = {}
  ): Promise<DeduplicationResult> {
    const response = await this.http.post<DeduplicationResult>('/deduplication/check', {
      questions,
      use_llm: options.useLLM ?? true,
      similarity_threshold: options.similarityThreshold ?? 0.85,
      borderline_low: 0.60,
    });

    return response.data;
  }

  // ── 3. Image Preprocessing ─────────────────────────────────

  async preprocessImage(
    imageBuffer: Buffer,
    mimeType: string,
    options: { maxWidth?: number; clipLimit?: number; runDeskew?: boolean } = {}
  ): Promise<PreprocessResult> {
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: 'image.png',
      contentType: mimeType,
    });
    form.append('max_width', String(options.maxWidth ?? 2000));
    form.append('clip_limit', String(options.clipLimit ?? 3.0));
    form.append('run_deskew', String(options.runDeskew ?? true));

    const response = await this.http.post<{ success: boolean; data: PreprocessResult }>(
      '/ocr/preprocess',
      form,
      { headers: form.getHeaders(), timeout: 60_000 }
    );

    return response.data.data;
  }

  // ── 4. Health check ────────────────────────────────────────

  async isHealthy(): Promise<boolean> {
    try {
      const res = await this.http.get('/health', { timeout: 5_000 });
      return res.data?.status === 'ok';
    } catch {
      return false;
    }
  }
}

// Export singleton (Node.js module cache makes this effectively a singleton)
export default new MLServiceClient();

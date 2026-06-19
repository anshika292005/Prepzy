/**
 * Prepzy — Analytics Controller (Node side)
 * ==========================================
 * Calls the Python ML microservice via mlClient.
 * Drop at: src/controllers/analytics.controller.ts
 *
 * Register in src/app.ts:
 *   import analyticsRoutes from './routes/analytics.routes';
 *   app.use('/api/analytics', analyticsRoutes);
 */

import { Response } from 'express';
import multer from 'multer';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthRequest } from '../types/index';
import mlClient from '../lib/mlClient';
import { extractTextFromImage } from '../lib/rag/fileProcessor';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// ─────────────────────────────────────────────
// GET /api/analytics/predictions/:userId
// ─────────────────────────────────────────────

export const getTopicPredictions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (req.user?.userId && req.user.userId !== userId) {
      sendError(res, 'Forbidden: you can only view your own analytics.', 403);
      return;
    }

    // mlClient handles MongoDB aggregation + call to Python
    const report = await mlClient.getTopicPredictions(userId);

    if (report.predictions.length === 0) {
      sendSuccess(res, {
        message: 'Not enough practice data yet. Complete sessions across multiple topics to unlock predictions.',
        ...report,
      });
      return;
    }

    sendSuccess(res, report);
  }
);

// ─────────────────────────────────────────────
// POST /api/analytics/deduplicate
// ─────────────────────────────────────────────

export const deduplicateQuestionsController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { questions, useLLM = true, similarityThreshold = 0.85 } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      sendError(res, 'questions array is required and must not be empty.', 400);
      return;
    }

    if (questions.length > 500) {
      sendError(res, 'Maximum 500 questions per batch.', 400);
      return;
    }

    const result = await mlClient.deduplicateQuestions(questions, { useLLM, similarityThreshold });
    sendSuccess(res, result);
  }
);

// ─────────────────────────────────────────────
// POST /api/analytics/preprocess-image
// ─────────────────────────────────────────────

export const preprocessImageController = [
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
      sendError(res, 'No file uploaded.', 400);
      return;
    }

    const runOCR = req.body.runOCR === 'true';
    const { buffer, mimetype } = req.file;

    // Preprocess via Python (real OpenCV CLAHE + adaptive thresholding)
    const preprocessed = await mlClient.preprocessImage(buffer, mimetype);

    const payload: Record<string, any> = { ...preprocessed };

    if (runOCR) {
      // Decode base64 PNG and pass to existing Claude OCR
      const pngBuffer = Buffer.from(preprocessed.processed_image_base64, 'base64');
      const text = await extractTextFromImage(pngBuffer, 'image/png');
      payload.extracted_text = text;
    }

    sendSuccess(res, payload);
  }),
];

// ─────────────────────────────────────────────
// GET /api/analytics/health
// ─────────────────────────────────────────────

export const mlHealthCheck = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const healthy = await mlClient.isHealthy();
    if (healthy) {
      sendSuccess(res, { ml_service: 'ok' });
    } else {
      sendError(res, 'ML service is unreachable. Check docker compose logs.', 503);
    }
  }
);

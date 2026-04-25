/**
 * Upload controller — handles file uploads for student notes
 * and manages note storage in ChromaDB.
 */

import { Response } from 'express';
import multer from 'multer';
import { ingestNotes } from '../lib/rag/ragPipeline';
import { deleteUserNotes, listUserTopics } from '../lib/rag/vectorStore';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthRequest } from '../types/index';

// ---------- Multer Config ----------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, JPEG, PNG, GIF, WebP.`));
    }
  },
});

const uploadSingle = upload.single('file');

// ---------- Controllers ----------

interface DeleteBody {
  userId: string;
  topic?: string;
}

const uploadNotes = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  // Handle multer upload within the async handler
  await new Promise<void>((resolve, reject) => {
    uploadSingle(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          reject(new Error('File size exceeds 10MB limit.'));
        } else {
          reject(new Error(`Upload error: ${err.message}`));
        }
      } else if (err instanceof Error) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  if (!req.file) {
    sendError(res, 'No file uploaded. Please attach a PDF or image file.', 400);
    return;
  }

  const userId = req.body.userId as string | undefined;
  const topic = req.body.topic as string | undefined;

  if (!userId || !topic) {
    sendError(res, 'userId and topic are required in the request body.', 400);
    return;
  }

  const result = await ingestNotes(
    userId,
    topic,
    req.file.buffer,
    req.file.mimetype
  );

  sendSuccess(res, {
    chunksStored: result.chunksStored,
    topic,
    fileName: req.file.originalname,
    fileSize: req.file.size,
  }, 201);
});

const deleteNotes = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, topic } = req.body as DeleteBody;

  if (!userId) {
    sendError(res, 'userId is required.', 400);
    return;
  }

  await deleteUserNotes(userId, topic);

  const message = topic
    ? `Notes for topic "${topic}" deleted successfully.`
    : 'All notes deleted successfully.';

  sendSuccess(res, { message });
});

const listTopics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.params.userId as string;

  if (!userId) {
    sendError(res, 'userId parameter is required.', 400);
    return;
  }

  const topics = await listUserTopics(userId);

  sendSuccess(res, { topics });
});

export { uploadNotes, deleteNotes, listTopics };

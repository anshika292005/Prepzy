/**
 * File processing utilities for uploaded student notes.
 * Supports PDF text extraction and image OCR via Claude vision.
 */

import pdfParse from 'pdf-parse';
import Anthropic from '@anthropic-ai/sdk';

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

// ---------- PDF Extraction ----------

const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  const result = await pdfParse(buffer);

  if (!result.text || result.text.trim().length === 0) {
    throw new Error('PDF contains no extractable text. It may be a scanned document — try uploading as an image.');
  }

  return result.text;
};

// ---------- Image OCR via Claude Vision ----------

const extractTextFromImage = async (
  buffer: Buffer,
  mimeType: string
): Promise<string> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
  }

  const anthropic = new Anthropic({ apiKey });
  const base64Data = buffer.toString('base64');

  const validMediaTypes: ImageMediaType[] = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  const mediaType = validMediaTypes.includes(mimeType as ImageMediaType)
    ? (mimeType as ImageMediaType)
    : 'image/jpeg';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: `Extract ALL text from this image precisely. This is a student's study notes or a scanned textbook page.

RULES:
1. Preserve the original structure (headings, bullet points, numbering).
2. For handwritten notes, do your best to transcribe accurately.
3. Include mathematical formulas in LaTeX notation where applicable.
4. If parts are illegible, mark them as [illegible].
5. Do not add any commentary — output only the extracted text.`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content from image extraction.');
  }

  return textBlock.text;
};

// ---------- Router ----------

const SUPPORTED_PDF_TYPES = ['application/pdf'];
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const processUpload = async (
  buffer: Buffer,
  mimeType: string
): Promise<string> => {
  if (SUPPORTED_PDF_TYPES.includes(mimeType)) {
    return extractTextFromPDF(buffer);
  }

  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    return extractTextFromImage(buffer, mimeType);
  }

  throw new Error(
    `Unsupported file type: ${mimeType}. Supported: PDF, JPEG, PNG, GIF, WebP.`
  );
};

export { extractTextFromPDF, extractTextFromImage, processUpload };

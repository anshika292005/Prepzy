"use strict";
/**
 * File processing utilities for uploaded student notes.
 * Supports PDF text extraction and image OCR via Claude vision.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUpload = exports.extractTextFromImage = exports.extractTextFromPDF = void 0;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
// ---------- PDF Extraction ----------
const extractTextFromPDF = async (buffer) => {
    const result = await (0, pdf_parse_1.default)(buffer);
    if (!result.text || result.text.trim().length === 0) {
        throw new Error('PDF contains no extractable text. It may be a scanned document — try uploading as an image.');
    }
    return result.text;
};
exports.extractTextFromPDF = extractTextFromPDF;
// ---------- Image OCR via Claude Vision ----------
const extractTextFromImage = async (buffer, mimeType) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
    }
    const anthropic = new sdk_1.default({ apiKey });
    const base64Data = buffer.toString('base64');
    const validMediaTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];
    const mediaType = validMediaTypes.includes(mimeType)
        ? mimeType
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
exports.extractTextFromImage = extractTextFromImage;
// ---------- Router ----------
const SUPPORTED_PDF_TYPES = ['application/pdf'];
const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];
const processUpload = async (buffer, mimeType) => {
    if (SUPPORTED_PDF_TYPES.includes(mimeType)) {
        return extractTextFromPDF(buffer);
    }
    if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
        return extractTextFromImage(buffer, mimeType);
    }
    throw new Error(`Unsupported file type: ${mimeType}. Supported: PDF, JPEG, PNG, GIF, WebP.`);
};
exports.processUpload = processUpload;

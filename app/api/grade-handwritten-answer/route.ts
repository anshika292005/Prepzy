import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 90;

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
]);

export async function POST(request: NextRequest) {
  try {
    const incoming = await request.formData();
    const file = incoming.get('file');
    const question = String(incoming.get('question') || '').trim();
    const correctAnswer = String(incoming.get('correct_answer') || '').trim();
    const rubric = String(incoming.get('rubric') || '').trim();
    const maxMarks = Number(incoming.get('max_marks') || 10);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Upload a handwritten answer image.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Use a JPEG, PNG, WebP, or TIFF image.' }, { status: 415 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'The image must be 15MB or smaller.' }, { status: 413 });
    }
    if (question.length < 3 || correctAnswer.length < 3) {
      return NextResponse.json(
        { error: 'Enter both the question and the correct answer.' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(maxMarks) || maxMarks <= 0 || maxMarks > 100) {
      return NextResponse.json({ error: 'Maximum marks must be between 1 and 100.' }, { status: 400 });
    }

    const outbound = new FormData();
    outbound.append('file', file);
    outbound.append('question', question);
    outbound.append('correct_answer', correctAnswer);
    outbound.append('max_marks', String(maxMarks));
    outbound.append('rubric', rubric);

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8080';
    const response = await fetch(`${mlServiceUrl}/ocr/grade-answer`, {
      method: 'POST',
      body: outbound,
      cache: 'no-store',
      signal: AbortSignal.timeout(85_000),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.detail || 'The grading service could not process this answer.' },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Handwritten grading proxy failed:', error);
    const timedOut = error?.name === 'TimeoutError';
    return NextResponse.json(
      { error: timedOut ? 'Grading timed out. Try a clearer or smaller image.' : 'The grading service is unavailable.' },
      { status: timedOut ? 504 : 503 }
    );
  }
}

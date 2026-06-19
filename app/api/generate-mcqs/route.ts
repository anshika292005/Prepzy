import { NextRequest } from 'next/server';
import { proxyToPython } from '../../../lib/pythonApi';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return proxyToPython(request, '/api/mcq/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
  });
}

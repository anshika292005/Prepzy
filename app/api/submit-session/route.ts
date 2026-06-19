import { NextRequest } from 'next/server';
import { proxyToPython } from '../../../lib/pythonApi';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return proxyToPython(request, '/api/submit-session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
  });
}

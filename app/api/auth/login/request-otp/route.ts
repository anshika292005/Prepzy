import { NextRequest } from 'next/server';
import { proxyToPython } from '../../../../../lib/pythonApi';

export async function POST(request: NextRequest) {
  return proxyToPython(request, '/api/auth/login/request-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
  });
}

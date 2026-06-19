import { NextRequest } from 'next/server';
import { proxyToPython } from '../../../lib/pythonApi';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') || '';
  return proxyToPython(request, `/api/analytics/dashboard/${encodeURIComponent(userId)}`);
}

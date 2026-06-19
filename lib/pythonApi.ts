import { NextRequest, NextResponse } from 'next/server';

const apiBase = () => process.env.PYTHON_API_URL || process.env.ML_SERVICE_URL || 'http://127.0.0.1:8080';

export async function proxyToPython(
  request: NextRequest,
  path: string,
  init: RequestInit = {}
): Promise<NextResponse> {
  const authorization = request.headers.get('authorization');
  const headers = new Headers(init.headers);
  if (authorization) headers.set('authorization', authorization);

  try {
    const response = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(90_000),
    });
    const contentType = response.headers.get('content-type') || 'application/json';
    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: { 'content-type': contentType },
    });
  } catch (error: any) {
    const timedOut = error?.name === 'TimeoutError';
    return NextResponse.json(
      { error: timedOut ? 'Python API timed out.' : 'Python API is unavailable.' },
      { status: timedOut ? 504 : 503 }
    );
  }
}

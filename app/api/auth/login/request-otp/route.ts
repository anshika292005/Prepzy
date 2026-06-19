import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../../../lib/firebaseAdmin';
import { createAndSendLoginOtp } from '../../../../../lib/loginOtp';

export const runtime = 'nodejs';

const verifyPassword = async (email: string, password: string) => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('FIREBASE_NOT_CONFIGURED');

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      cache: 'no-store',
    }
  );

  if (!response.ok) throw new Error('INVALID_CREDENTIALS');
  const result = await response.json();
  return {
    uid: result.localId as string,
    email: result.email as string,
    idToken: result.idToken as string,
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let uid: string;
    let email: string;

    if (body.idToken) {
      const decoded = await adminAuth.verifyIdToken(String(body.idToken));
      if (!decoded.email) throw new Error('EMAIL_REQUIRED');
      uid = decoded.uid;
      email = decoded.email;
    } else {
      if (!body.email || !body.password) {
        return NextResponse.json(
          { error: 'Email and password are required.' },
          { status: 400 }
        );
      }
      const verified = await verifyPassword(
        String(body.email).trim(),
        String(body.password)
      );
      uid = verified.uid;
      email = verified.email;

      const user = await adminAuth.getUser(uid);
      if (!user.emailVerified) {
        return NextResponse.json(
          { error: 'Verify your email before signing in.' },
          { status: 403 }
        );
      }
    }

    const challenge = await createAndSendLoginOtp({ uid, email });
    return NextResponse.json({
      success: true,
      ...challenge,
      destination: email.replace(/^(.{2}).*(@.*)$/, '$1***$2'),
    });
  } catch (error: any) {
    console.error('Login OTP request failed:', error);
    if (error.message === 'OTP_RATE_LIMITED') {
      return NextResponse.json(
        { error: 'Please wait one minute before requesting another code.' },
        { status: 429 }
      );
    }
    if (error.message === 'INVALID_CREDENTIALS') {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Unable to send a login code. Check the server email configuration.' },
      { status: 500 }
    );
  }
}

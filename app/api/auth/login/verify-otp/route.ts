import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../../../lib/firebaseAdmin';
import { consumeLoginOtp } from '../../../../../lib/loginOtp';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const challengeId = String(body.challengeId || '');
    const otp = String(body.otp || '').replace(/\D/g, '');

    if (!challengeId || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Enter the six-digit code.' },
        { status: 400 }
      );
    }

    const challenge = await consumeLoginOtp({ challengeId, otp });
    const customToken = await adminAuth.createCustomToken(challenge.uid, {
      otpVerified: true,
    });

    return NextResponse.json({ success: true, customToken });
  } catch (error: any) {
    console.error('Login OTP verification failed:', error);
    const messages: Record<string, string> = {
      OTP_INVALID: 'The code is incorrect.',
      OTP_EXPIRED: 'The code has expired. Request a new one.',
      OTP_ATTEMPTS_EXCEEDED: 'Too many incorrect attempts. Request a new code.',
    };
    return NextResponse.json(
      { error: messages[error.message] || 'Unable to verify the code.' },
      { status: 401 }
    );
  }
}

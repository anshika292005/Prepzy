import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { adminDb } from './firebaseAdmin';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const requireEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

const hash = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex');

const hashOtp = (challengeId: string, otp: string): string =>
  hash(`${challengeId}:${otp}:${requireEnv('OTP_SECRET')}`);

const secureEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const transporter = () =>
  nodemailer.createTransport({
    host: requireEnv('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASS'),
    },
  });

export const createAndSendLoginOtp = async ({
  uid,
  email,
}: {
  uid: string;
  email: string;
}): Promise<{ challengeId: string; expiresInSeconds: number }> => {
  const normalizedEmail = email.trim().toLowerCase();
  const rateLimitRef = adminDb.collection('login_otp_limits').doc(hash(normalizedEmail));
  const now = Date.now();

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(rateLimitRef);
    const lastSentAt = snapshot.data()?.last_sent_at ?? 0;
    if (now - lastSentAt < RESEND_COOLDOWN_MS) {
      throw new Error('OTP_RATE_LIMITED');
    }
    transaction.set(rateLimitRef, { last_sent_at: now }, { merge: true });
  });

  const challengeId = crypto.randomUUID();
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = now + OTP_TTL_MS;

  await adminDb.collection('login_otps').doc(challengeId).set({
    uid,
    email: normalizedEmail,
    otp_hash: hashOtp(challengeId, otp),
    attempts: 0,
    expires_at: expiresAt,
    created_at: now,
  });

  try {
    await transporter().sendMail({
      from: process.env.SMTP_FROM || requireEnv('SMTP_USER'),
      to: normalizedEmail,
      subject: 'Your Prepzy login code',
      text: `Your Prepzy login code is ${otp}. It expires in 5 minutes. If you did not request this, ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#172033">
          <h2 style="margin:0 0 12px">Confirm your Prepzy login</h2>
          <p style="color:#667085">Enter this one-time code to finish signing in:</p>
          <div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#3b5cff;margin:28px 0">${otp}</div>
          <p style="color:#667085">This code expires in 5 minutes and can only be used once.</p>
          <p style="color:#98a2b3;font-size:12px">If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    await adminDb.collection('login_otps').doc(challengeId).delete();
    throw error;
  }

  return { challengeId, expiresInSeconds: OTP_TTL_MS / 1000 };
};

export const consumeLoginOtp = async ({
  challengeId,
  otp,
}: {
  challengeId: string;
  otp: string;
}): Promise<{ uid: string; email: string }> => {
  const challengeRef = adminDb.collection('login_otps').doc(challengeId);

  const result = await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(challengeRef);
    if (!snapshot.exists) {
      return { status: 'OTP_INVALID' as const };
    }

    const data = snapshot.data()!;
    if (Date.now() > data.expires_at) {
      transaction.delete(challengeRef);
      return { status: 'OTP_EXPIRED' as const };
    }

    if (data.attempts >= MAX_ATTEMPTS) {
      transaction.delete(challengeRef);
      return { status: 'OTP_ATTEMPTS_EXCEEDED' as const };
    }

    const candidateHash = hashOtp(challengeId, otp);
    if (!secureEqual(candidateHash, data.otp_hash)) {
      const nextAttempts = data.attempts + 1;
      if (nextAttempts >= MAX_ATTEMPTS) {
        transaction.delete(challengeRef);
        return { status: 'OTP_ATTEMPTS_EXCEEDED' as const };
      }
      transaction.update(challengeRef, { attempts: nextAttempts });
      return { status: 'OTP_INVALID' as const };
    }

    transaction.delete(challengeRef);
    return { status: 'OK' as const, uid: data.uid, email: data.email };
  });

  if (result.status !== 'OK') {
    throw new Error(result.status);
  }
  return { uid: result.uid, email: result.email };
};

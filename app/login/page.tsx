'use client';

import React, { useState } from 'react';
import { auth } from '../../lib/firebase';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const router = useRouter();

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user, { url: `${window.location.origin}/login` });
        await signOut(auth);
        setMessage({ type: 'error', text: 'Please verify your email first. A verification code was sent.' });
        return;
      }
      router.push('/dashboard');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (!fullName.trim()) {
        setMessage({ type: 'error', text: 'Full name is required.' });
        return;
      }
      if (password.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match.' });
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: fullName.trim() });
      await sendEmailVerification(credential.user, { url: `${window.location.origin}/login` });
      await signOut(auth);
      setMessage({ type: 'success', text: 'OTP/verification link sent to your email. Verify and then login.' });
      setAuthMode('login');
      resetForm();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Enter your email first.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email.trim());
      if (signInMethods.length === 0) {
        setMessage({ type: 'error', text: 'No user found with this email. Please sign up first.' });
        return;
      }

      if (!signInMethods.includes('password')) {
        setMessage({ type: 'error', text: 'This account does not use password login. Please continue with Google.' });
        return;
      }

      await sendPasswordResetEmail(auth, email);
      setMessage({ type: 'success', text: 'Password reset code sent to your email.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col relative font-sans text-[#111827] overflow-hidden">
      <Script
        src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.10/dist/dotlottie-wc.js"
        type="module"
        strategy="afterInteractive"
      />

      <div className="absolute top-8 left-8 z-50">
        <Link href="/" className="flex items-center h-10 w-auto">
          <img src="/logo.svg" alt="Prepzy Logo" className="h-full w-auto" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center w-full max-w-[2000px] mx-auto px-6 lg:px-12 min-h-screen relative overflow-hidden">
        {/* Left Column: Login Card */}
        <div className="w-full lg:w-[45%] flex items-center justify-center lg:justify-start lg:pl-20 relative z-20">
          <div className="w-full max-w-[400px] bg-white rounded-[2rem] p-7 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-100 relative">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black mb-2 text-slate-900">{authMode === 'login' ? 'Login' : 'Sign Up'}</h1>
              <p className="text-slate-400 text-xs font-medium">
                {authMode === 'login'
                  ? 'Welcome back! Enter your credentials.'
                  : 'Create your account to get started.'}
              </p>
            </div>

            <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-3">
              {authMode === 'signup' && (
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl transition outline-none text-slate-900 placeholder-slate-400 focus:border-[#3B5CFF] focus:bg-white text-sm"
                />
              )}

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl transition outline-none text-slate-900 placeholder-slate-400 focus:border-[#3B5CFF] focus:bg-white text-sm"
              />

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl transition outline-none text-slate-900 placeholder-slate-400 focus:border-[#3B5CFF] focus:bg-white text-sm"
              />

              {authMode === 'signup' && (
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl transition outline-none text-slate-900 placeholder-slate-400 focus:border-[#3B5CFF] focus:bg-white"
                />
              )}

              {message && (
                <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-white font-black text-base rounded-xl transition disabled:opacity-50 hover:brightness-110 shadow-xl shadow-blue-200"
                style={{ backgroundColor: '#3B5CFF' }}
              >
                {isLoading ? 'Processing...' : authMode === 'login' ? 'Login' : 'Send OTP'}
              </button>

              {authMode === 'login' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="text-[#3B5CFF] text-sm font-bold hover:underline transition"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </form>

            <div className="my-10 flex items-center gap-4 text-slate-300">
              <div className="flex-1 h-[1px] bg-slate-200"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Or</span>
              <div className="flex-1 h-[1px] bg-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 bg-white border border-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition disabled:opacity-50 text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="mt-10 text-center text-sm text-slate-500">
              {authMode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setMessage(null);
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-[#3B5CFF] font-black hover:underline transition"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setMessage(null);
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-[#3B5CFF] font-black hover:underline transition"
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Massive Centered Illustration */}
        <div className="w-full lg:w-[60%] flex items-center justify-center relative z-10 lg:pl-10 translate-y-60">
          <dotlottie-wc
            src="https://lottie.host/46d95345-9494-4f9c-9853-35563a72e446/IJXL82JCKO.lottie"
            className="w-full h-auto object-contain drop-shadow-[0_40px_100px_rgba(59,92,255,0.15)] scale-110 lg:scale-125 origin-center"
            style={{ minHeight: '800px' }}
            autoplay
            loop
          />
        </div>
      </div>
    </div>
  );
}

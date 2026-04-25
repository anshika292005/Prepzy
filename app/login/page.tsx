'use client';

import React, { useState } from 'react';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Email and password required for sign up.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage({ type: 'success', text: 'Account created! Welcome to ExamCopilot.' });
      router.push('/dashboard');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-indigo-100 text-sm">Sign in to your ExamCopilot</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none"
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-wider ${
              message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Sign In'}
            </button>
            <button 
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full py-4 bg-white text-slate-700 border border-slate-200 font-bold rounded-2xl hover:bg-slate-50 transition"
            >
              Create New Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

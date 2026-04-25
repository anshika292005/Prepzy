'use client';

import React from 'react';
import Link from 'next/link';

export default function AppPortal() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Dynamic Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-[#3B5CFF] rounded-[2.5rem] p-10 lg:p-16 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Ready to beat your<br /> competitive goals?
          </h1>
          <p className="text-indigo-100 text-lg md:text-xl font-medium max-w-lg opacity-90">
            Welcome back to Prepzy. Your AI agents have processed your latest notes and are ready for analysis.
          </p>
          <div className="flex items-center gap-4 pt-6">
            <Link href="/quiz" className="px-8 py-4 bg-white text-[#3B5CFF] font-extrabold rounded-2xl hover:bg-slate-50 transition shadow-lg shadow-blue-800/20">
              New Practice Session
            </Link>
            <Link href="/exam-mode" className="px-8 py-4 bg-blue-500 text-white font-extrabold rounded-2xl border border-blue-400 hover:bg-blue-400 transition">
              Launch Exam Mode
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-white/5 rounded-tl-[5rem] border-t border-l border-white/10 backdrop-blur-3xl hidden lg:block"></div>
      </section>

      {/* Dynamic Feature Hub */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Card 1: Practice */}
        <Link href="/quiz" className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
             <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
             </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Adaptive Practice</h3>
          <p className="text-slate-500 font-medium leading-relaxed">Generate custom MCQs from your notes using our Groq-powered AI pipeline.</p>
          <div className="mt-8 flex items-center text-blue-600 font-bold gap-2">
             Go Practice <span className="text-xl">→</span>
          </div>
        </Link>

        {/* Card 2: Exam Mode */}
        <Link href="/exam-mode" className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-transform">
             <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Simulate Exam</h3>
          <p className="text-slate-500 font-medium leading-relaxed">Full JEE/UPSC simulators with strict timing and official marking schemes.</p>
          <div className="mt-8 flex items-center text-rose-600 font-bold gap-2">
             Start Test <span className="text-xl">→</span>
          </div>
        </Link>

        {/* Card 3: Performance */}
        <Link href="/dashboard" className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
             <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Mastery Board</h3>
          <p className="text-slate-500 font-medium leading-relaxed">Deep dive into your accuracy trends and see your Elo rating climb.</p>
          <div className="mt-8 flex items-center text-emerald-600 font-bold gap-2">
             View Stats <span className="text-xl">→</span>
          </div>
        </Link>
      </section>

      {/* Quick Launch Stats */}
      <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
         <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-slate-900">Your Progress</h3>
               <p className="text-slate-500 font-medium">Keep up the momentum to reach your peak performance.</p>
               <div className="flex gap-3 pt-4">
                  <div className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-widest rounded-xl">7 Day Streak 🔥</div>
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest rounded-xl">Expert Level</div>
               </div>
            </div>
            
            <div className="flex gap-8 items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Solved</p>
                  <p className="text-3xl font-black text-slate-900">1,248</p>
               </div>
               <div className="w-[1px] h-10 bg-slate-200"></div>
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Score</p>
                  <p className="text-3xl font-black text-[#3B5CFF]">84%</p>
               </div>
               <div className="w-[1px] h-10 bg-slate-200"></div>
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Elo Rank</p>
                  <p className="text-3xl font-black text-slate-900">1420</p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}

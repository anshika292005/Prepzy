'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Script from 'next/script';
import { 
  ChevronRight 
} from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

const FeatureCard = ({ title, description, href, icon, color }: FeatureCardProps) => {
  const colorMap: Record<string, { bg: string, text: string, layer: string, border: string }> = {
    rose: { bg: 'bg-rose-50', text: 'text-rose-500', layer: 'bg-rose-100/50', border: 'group-hover:border-rose-300' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-500', layer: 'bg-blue-100/50', border: 'group-hover:border-blue-300' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-500', layer: 'bg-amber-100/50', border: 'group-hover:border-amber-300' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-500', layer: 'bg-indigo-100/50', border: 'group-hover:border-indigo-300' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', layer: 'bg-emerald-100/50', border: 'group-hover:border-emerald-300' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-500', layer: 'bg-cyan-100/50', border: 'group-hover:border-cyan-300' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-500', layer: 'bg-violet-100/50', border: 'group-hover:border-violet-300' },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <Link href={href} className={`group bg-[#F9FAFB] p-5 rounded-xl border border-slate-200 transition-all duration-200 flex items-start gap-4 ${colors.border} hover:bg-white hover:shadow-sm`}>
      <div className="relative shrink-0 mt-0.5">
        <div className={`w-10 h-10 ${colors.bg} ${colors.text} rounded-lg flex items-center justify-center relative z-10 transition-transform`}>
          {icon}
        </div>
        <div className={`absolute -left-1 -bottom-1 w-10 h-10 ${colors.layer} rounded-lg -z-0 transition-transform opacity-60`}></div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-[#2D3748] text-[16px] tracking-tight">{title}</h3>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
        <p className="text-[14px] text-[#718096] font-normal leading-tight mt-1.5 line-clamp-2">
          {description}
        </p>
      </div>
    </Link>
  );
};

export default function AppPortal() {
  const [stats, setStats] = useState({
    totalSolved: 0,
    avgScore: 0,
    eloRank: 1200,
    streak: 0,
    level: 'Beginner'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const response = await fetch(`/api/user-stats?userId=${user.uid}`);
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await response.json();
              if (data && !data.error) {
                setStats(data);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const features = [
    {
      title: "Adaptive Practice",
      description: "Generate custom MCQs from your notes using AI.",
      href: "/quiz",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
      color: "rose"
    },
    {
      title: "Simulate Exam",
      description: "Full JEE/UPSC simulators with strict timing.",
      href: "/exam-mode",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      ),
      color: "amber"
    },
    {
      title: "Mastery Board",
      description: "Deep dive into your accuracy trends and Elo rating.",
      href: "/dashboard",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M5 19h2v-5H5v5zM11 19h2v-11h-2v11zM17 19h2v-8h-2v8zM3 21h18v-2H3v2z" />
        </svg>
      ),
      color: "indigo"
    },
    {
      title: "History",
      description: "Review your past performance and missed questions.",
      href: "/history",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: "cyan"
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <Script 
        src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.10/dist/dotlottie-wc.js" 
        type="module" 
      />
      
      {/* Dynamic Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-[#3B5CFF] rounded-[2.5rem] p-10 lg:p-14 text-white shadow-2xl shadow-blue-200 relative overflow-hidden min-h-[350px]">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Ready to beat your<br /> competitive goals?
          </h1>
          <p className="text-indigo-50 text-lg font-normal max-w-lg opacity-80 leading-relaxed">
            Welcome back to Prepzy. Your AI agents have processed your latest notes and are ready for analysis.
          </p>
          <div className="flex items-center gap-4 pt-6">
            <Link href="/quiz" className="px-8 py-4 bg-white text-[#3B5CFF] font-bold rounded-2xl hover:bg-slate-50 transition shadow-lg shadow-blue-800/20">
              New Practice Session
            </Link>
            <Link href="/exam-mode" className="px-6 py-4 bg-blue-500 text-white font-bold rounded-2xl border border-blue-400 hover:bg-blue-400 transition">
              Launch Exam Mode
            </Link>
          </div>
        </div>

        {/* Lottie Animation Right Side */}
        <div className="relative md:absolute md:right-10 md:top-1/2 md:-translate-y-1/2 w-full md:w-[45%] lg:w-[40%] h-64 md:h-[80%] flex items-center justify-center z-10">
          <dotlottie-wc 
            src="https://lottie.host/d361cba7-f410-46ab-a19b-16e0ea0bff55/gffpnvslfy.lottie" 
            autoplay 
            loop 
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      </section>

      {/* Feature Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 px-1">Learning Hub</h2>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </section>
      </div>

      {/* Dynamic Stats Section */}
      <section className="space-y-4 mt-8">
         <div className="px-1">
            <h3 className="text-2xl font-bold text-slate-900">Your Progress</h3>
         </div>
         <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="flex items-center gap-4">
               <div className="w-32 h-32 md:w-44 md:h-44 shrink-0 -ml-4">
                  <dotlottie-wc 
                    src="/animations/success-target.json" 
                    autoplay 
                    loop 
                    style={{ width: '100%', height: '100%' }}
                  />
               </div>
               <div className="space-y-2">
                  <p className="text-slate-500 font-medium">Keep up the momentum to reach your peak performance.</p>
                  <div className="flex gap-3 pt-4">
                     <div className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest rounded-xl">
                       {stats.streak} Day Streak
                     </div>
                     <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-widest rounded-xl">
                       {stats.level} Level
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="flex gap-8 items-center bg-[#F9FAFB] p-5 rounded-xl border border-slate-200 transition-all duration-200 hover:bg-white hover:shadow-sm">
               <div className="text-center min-w-[80px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Solved</p>
                  <p className="text-3xl font-black text-slate-900">{stats.totalSolved.toLocaleString()}</p>
               </div>
               <div className="w-[1px] h-10 bg-slate-200"></div>
               <div className="text-center min-w-[80px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Score</p>
                  <p className="text-3xl font-black text-[#3B5CFF]">{stats.avgScore}%</p>
               </div>
               <div className="w-[1px] h-10 bg-slate-200"></div>
               <div className="text-center min-w-[80px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Elo Rank</p>
                  <p className="text-3xl font-black text-slate-900">{stats.eloRank}</p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}

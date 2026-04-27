'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import Script from 'next/script';
import { 
  History, 
  Calendar, 
  Target, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

interface Session {
  id: string;
  topic: string;
  exam_type: string;
  created_at: string;
  total_questions: number;
  correct_count: number;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const sessionsRef = collection(db, 'sessions');
          const q = query(
            sessionsRef, 
            where('user_id', '==', user.uid),
            orderBy('created_at', 'desc')
          );
          
          let snap;
          try {
            snap = await getDocs(q);
          } catch (indexErr: any) {
            console.warn("Index not yet ready, using client-side sort fallback");
            const fallbackQ = query(sessionsRef, where('user_id', '==', user.uid));
            const fallbackSnap = await getDocs(fallbackQ);
            const results = fallbackSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Session)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setSessions(results);
          }

          if (snap) {
            const results = snap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Session));
            setSessions(results);
          }
        } catch (err: any) {
          console.error("History fetch error:", err);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getAccuracy = (correct: number, total: number) => {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  const getExamColor = (type: string) => {
    switch (type) {
      case 'JEE': return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };
      case 'UPSC': return { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' };
      case 'NEET': return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' };
      default: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="h-64 bg-[#3B5CFF] rounded-[2.5rem] animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[#F9FAFB] rounded-xl border border-slate-200 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <Script 
        src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.10/dist/dotlottie-wc.js" 
        type="module" 
      />

      {/* Premium Header */}
      <section className="bg-[#3B5CFF] rounded-[2.5rem] p-10 lg:p-14 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <History className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-50">Performance Timeline</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Review your <br />learning journey.
          </h1>
          <p className="text-indigo-50 text-lg font-normal opacity-80 leading-relaxed max-w-lg">
            Track your milestones, analyze past sessions, and identify areas for structural improvement.
          </p>
        </div>

        {/* Decorative Lottie */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-100 pointer-events-none hidden md:block">
           <dotlottie-wc 
             src="https://lottie.host/5f178ce9-e3e4-4450-93f5-73d5e7561c54/5qvJTBvrmq.lottie" 
             autoplay 
             loop 
             style={{ width: '100%', height: '100%' }}
           />
        </div>
        
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      </section>

      {/* History List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Sessions</h2>
           <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
             <Calendar className="w-4 h-4" />
             <span>Showing {sessions.length} records</span>
           </div>
        </div>

        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {sessions.map((session) => {
              const colors = getExamColor(session.exam_type);
              const accuracy = getAccuracy(session.correct_count, session.total_questions);
              
              return (
                <div key={session.id} className="group bg-[#F9FAFB] p-6 rounded-xl border border-slate-200 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white hover:shadow-md hover:border-blue-200">
                  <div className="flex items-center gap-6 flex-1">
                    <div className={`w-16 h-16 shrink-0 rounded-2xl ${colors.bg} ${colors.text} ${colors.border} border-2 flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform`}>
                       <span className="text-[10px] font-black uppercase tracking-tighter opacity-50 mb-0.5">{session.exam_type}</span>
                       <Target className="w-6 h-6" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight truncate">{session.topic}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {session.exam_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-400 text-xs font-semibold">
                         <div className="flex items-center gap-1">
                           <Clock className="w-3 h-3" />
                           {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                         </div>
                         <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                         <div className="flex items-center gap-1 text-slate-500">
                           <Award className="w-3 h-3" />
                           {session.total_questions} Questions
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 md:pl-6 md:border-l border-slate-100">
                    <div className="text-center min-w-[80px]">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Accuracy</p>
                      <p className={`text-2xl font-black ${accuracy >= 80 ? 'text-emerald-500' : accuracy >= 50 ? 'text-blue-500' : 'text-slate-900'}`}>
                        {accuracy}%
                      </p>
                    </div>
                    <div className="text-center min-w-[100px]">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Breakdown</p>
                      <div className="flex items-baseline justify-center gap-1">
                         <span className="text-2xl font-black text-slate-900">{session.correct_count}</span>
                         <span className="text-slate-300 font-bold text-sm">/</span>
                         <span className="text-slate-400 font-bold text-sm">{session.total_questions}</span>
                      </div>
                    </div>
                    <Link 
                      href={`/quiz?session=${session.id}`} 
                      className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-[#3B5CFF] hover:text-white hover:border-[#3B5CFF] transition-all shadow-sm"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#F9FAFB] rounded-[2.5rem] border border-slate-200 p-20 text-center space-y-6">
            <div className="w-48 h-48 mx-auto">
               <dotlottie-wc 
                 src="https://lottie.host/9461c605-8388-4e96-9841-101d32f8438b/8hKc3HEMBh.lottie" 
                 autoplay 
                 loop 
                 style={{ width: '100%', height: '100%' }}
               />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">No sessions recorded yet</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Start your first practice session to begin building your performance history.</p>
            </div>
            <Link href="/quiz" className="inline-flex items-center gap-2 px-8 py-4 bg-[#3B5CFF] text-white rounded-2xl font-black text-sm tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all">
              BEGIN NOW <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

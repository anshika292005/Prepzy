'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';

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
          if (err.message?.includes('index')) {
            console.warn("QUERY FAILED: Missing Firestore index. Check the console for the creation link.");
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Practice History</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-10">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900">Practice History</h1>
          <p className="text-slate-500 font-medium">Review your journey and track key milestones.</p>
        </div>
        <Link href="/quiz" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
          Start New Prep
        </Link>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div key={session.id} className="p-8 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2x flex items-center justify-center font-black ${
                    session.exam_type === 'JEE' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {session.exam_type[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{session.topic}</h3>
                    <p className="text-sm text-slate-400 font-semibold">{new Date(session.created_at).toLocaleDateString()}</p>
                  </div>
               </div>
               <div className="flex items-center gap-10">
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                  <p className="text-2xl font-black text-indigo-600">{session.correct_count} / {session.total_questions}</p>
                </div>
               </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center">
             <p className="text-slate-400 font-bold mb-6">No sessions found.</p>
             <Link href="/quiz" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black">Begin Now</Link>
          </div>
        )}
      </div>
    </div>
  );
}

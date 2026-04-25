'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { PerformanceDashboard } from '../../components/PerformanceDashboard';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        setIsLoading(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      console.log("Fetching stats for:", user?.uid);
      
      let topicScores: any[] = [];
      let dailyData: any[] = [];

      try {
        const scoresRef = collection(db, 'skill_scores');
        const scoresQuery = query(scoresRef, where('user_id', '==', user?.uid));
        const scoresSnap = await getDocs(scoresQuery);
        topicScores = scoresSnap.docs.map(doc => ({
          topic: doc.data().topic,
          accuracy: Math.round((doc.data().correct_count / (doc.data().total_questions || 1)) * 100),
          totalQuestions: doc.data().total_questions,
          skillScore: doc.data().skill_score
        }));
      } catch (e) {
        console.warn("Skill scores error", e);
      }

      try {
        const sessionsRef = collection(db, 'sessions');
        let sessionsQuery = query(
          sessionsRef, 
          where('user_id', '==', user?.uid),
          orderBy('created_at', 'desc'),
          limit(7)
        );
        
        let sessionsSnap;
        try {
          sessionsSnap = await getDocs(sessionsQuery);
        } catch (indexErr: any) {
          console.warn("Index still building, falling back to client-side sort");
          // Fallback: Fetch without sorting and sort manually
          const fallbackQuery = query(sessionsRef, where('user_id', '==', user?.uid), limit(50));
          const fallbackSnap = await getDocs(fallbackQuery);
          // Sort client side
          const sortedDocs = [...fallbackSnap.docs].sort((a, b) => b.data().created_at - a.data().created_at).slice(0, 7);
          dailyData = sortedDocs.map(doc => ({
            date: new Date(doc.data().created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            accuracy: Math.round((doc.data().correct_count / (doc.data().total_questions || 1)) * 100),
            questionsAnswered: doc.data().total_questions
          })).reverse();
        }

        if (sessionsSnap) {
          dailyData = sessionsSnap.docs.map(doc => ({
            date: new Date(doc.data().created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            accuracy: Math.round((doc.data().correct_count / (doc.data().total_questions || 1)) * 100),
            questionsAnswered: doc.data().total_questions
          })).reverse();
        }
      } catch (e) {
        console.warn("Sessions error", e);
      }

      setStats({
        topicScores,
        dailyData,
        weakTopics: [],
        totalQuestions: topicScores.reduce((acc, curr) => acc + (curr.totalQuestions || 0), 0),
        avgAccuracy: topicScores.length ? Math.round(topicScores.reduce((acc, curr) => acc + curr.accuracy, 0) / topicScores.length) : 0,
        streak: 0
      });
      setIsLoading(false);
    }

    fetchStats();
    
    // Safety fallback
    const t = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(t);
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Performance Command Center</h1>
        <p className="text-slate-500 font-medium">Real-time analysis of your JEE/UPSC preparation trajectory.</p>
      </header>

      {stats && (
        <PerformanceDashboard 
          topicScores={stats.topicScores}
          dailyData={stats.dailyData}
          weakTopics={stats.weakTopics}
          totalQuestions={stats.totalQuestions}
          avgAccuracy={stats.avgAccuracy}
          streak={stats.streak}
        />
      )}
    </div>
  );
}

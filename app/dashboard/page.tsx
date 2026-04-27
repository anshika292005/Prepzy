'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { PerformanceDashboard } from '../../components/PerformanceDashboard';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { LayoutDashboard } from 'lucide-react';

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
      try {
        const response = await fetch(`/api/user-stats?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
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
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-50">Mastery Control Room</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Performance <br />Command Center.
          </h1>
          <p className="text-indigo-50 text-lg font-normal opacity-80 leading-relaxed max-w-lg">
            Real-time analysis of your preparation trajectory. Monitor your Elo rank and identify subject vectors for optimization.
          </p>
        </div>

        {/* Decorative Lottie */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none hidden md:block">
           <dotlottie-wc 
             src="https://lottie.host/b63b029a-6842-424b-b100-b291608f00a0/RSWNmcQbB3.lottie" 
             autoplay 
             loop 
             style={{ width: '100%', height: '100%' }}
           />
        </div>
        
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      </section>

      {stats && (
        <PerformanceDashboard 
          topicScores={stats.topicScores || []}
          dailyData={stats.dailyData || []}
          weakTopics={stats.weakTopics || []}
          totalQuestions={stats.totalSolved || 0}
          avgAccuracy={stats.avgScore || 0}
          streak={stats.streak || 0}
        />
      )}
    </div>
  );
}

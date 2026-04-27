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

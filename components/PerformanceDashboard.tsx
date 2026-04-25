'use client';

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

export interface TopicScore {
  topic: string;
  accuracy: number;
  totalQuestions: number;
  skillScore: number;
}

export interface DailyData {
  date: string;
  accuracy: number;
  questionsAnswered: number;
}

export interface WeakTopic {
  topic: string;
  subtopic: string;
  accuracy: number;
  priority: 'High' | 'Medium' | 'Low';
  studyTip: string;
}

export interface DashboardProps {
  topicScores: TopicScore[];
  dailyData: DailyData[];
  weakTopics: WeakTopic[];
  totalQuestions: number;
  avgAccuracy: number;
  streak: number;
  isLoading?: boolean;
}

export function PerformanceDashboard({
  topicScores,
  dailyData,
  weakTopics,
  totalQuestions,
  avgAccuracy,
  streak,
  isLoading
}: DashboardProps) {
  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  // Pre-process Data
  const sortedWeakTopics = [...weakTopics].sort((a, b) => {
    const pWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return pWeight[b.priority] - pWeight[a.priority];
  });

  const radarData = topicScores.slice(0, 8);

  const getAccuracyBadgeColor = (acc: number) => {
    if (acc > 70) return 'bg-green-100 text-green-800 border-green-200';
    if (acc >= 40) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getPriorityBadgeColor = (prio: string) => {
    if (prio === 'High') return 'bg-red-100 text-red-800';
    if (prio === 'Medium') return 'bg-amber-100 text-amber-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="w-full space-y-8 pb-10">
      
      {/* 1. Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Topics Practiced', val: topicScores.length },
          { label: 'Questions Answered', val: totalQuestions },
          { label: 'Avg Accuracy', val: `${Math.round(avgAccuracy)}%` },
          { label: 'Day Streak', val: `${streak} 🔥` },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* 2. Two charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 font-sans">Topic Mastery</h3>
          <div className="h-72 w-full">
            {radarData.length > 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="topic" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Radar name="Accuracy" dataKey="accuracy" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Accuracy']} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Practice at least 3 topics to unlock radar chart
              </div>
            )}
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 font-sans">7-Day Accuracy Trend</h3>
          <div className="h-72 w-full">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(val: any) => [`${val}%`, 'Accuracy']} 
                    labelStyle={{ color: '#111827', fontWeight: 600 }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No recent activity to display
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. Weak topics panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">Action Plan: Weak Topics</h3>
          <p className="text-sm text-gray-500 mt-1">Focus your studying on these high-priority areas</p>
        </div>
        
        {sortedWeakTopics.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {sortedWeakTopics.map((topic, i) => (
              <div key={i} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-gray-900">{topic.topic}</h4>
                      <span className="text-gray-400 text-sm">&bull;</span>
                      <span className="text-gray-600 text-sm font-medium">{topic.subtopic}</span>
                    </div>
                    <p className="text-sm text-gray-500 max-w-2xl leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                      <strong className="text-blue-800 font-semibold mr-2">Study Tip:</strong> 
                      {topic.studyTip}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 self-start md:self-center shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getPriorityBadgeColor(topic.priority)}`}>
                      {topic.priority} Priority
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getAccuracyBadgeColor(topic.accuracy)}`}>
                      {topic.accuracy}% Accuracy
                    </span>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">Excellent Work!</h4>
            <p className="text-gray-500 text-sm">No weak topics identified yet. Keep practicing!</p>
          </div>
        )}
      </div>

    </div>
  );
}

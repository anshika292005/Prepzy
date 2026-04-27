import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch Skill Scores from Firestore
    const skillScoresSnap = await adminDb.collection('skill_scores')
      .where('user_id', '==', userId)
      .get();
    
    const topicScores = skillScoresSnap.docs.map(doc => {
      const data = doc.data();
      const total = data.total_questions || 0;
      const correct = data.correct_count || 0;
      return {
        topic: data.topic,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        totalQuestions: total,
        skillScore: data.skill_score || 1200
      };
    });

    // 2. Fetch Sessions for Streak and Daily Data
    const sessionsSnap = await adminDb.collection('sessions')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();
    
    const sessions = sessionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as any));

    // Calculate streak
    let streak = 0;
    if (sessions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let lastDate = new Date(sessions[0].created_at);
      lastDate.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak = 1;
        for (let i = 1; i < sessions.length; i++) {
          const currentDate = new Date(sessions[i].created_at);
          currentDate.setHours(0, 0, 0, 0);
          const dayDiff = (lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
          if (dayDiff === 1) {
            streak++;
            lastDate = currentDate;
          } else if (dayDiff > 1) {
            break;
          }
        }
      }
    }

    // Format daily data (last 7 active days)
    const dailyDataMap = new Map();
    sessions.slice(0, 15).forEach(session => {
      const date = new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!dailyDataMap.has(date)) {
        dailyDataMap.set(date, {
          date,
          accuracy: Math.round((session.correct_count / (session.total_questions || 1)) * 100),
          questionsAnswered: session.total_questions
        });
      }
    });
    const dailyData = Array.from(dailyDataMap.values()).reverse().slice(-7);

    // Aggregate totals
    let totalSolved = 0;
    let totalCorrect = 0;
    let sumElo = 0;

    topicScores.forEach(ts => {
      totalSolved += ts.totalQuestions;
      totalCorrect += (ts.totalQuestions * ts.accuracy) / 100;
      sumElo += ts.skillScore;
    });

    const avgScore = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
    const avgElo = topicScores.length > 0 ? Math.round(sumElo / topicScores.length) : 1200;

    // Weak topics
    const weakTopics = topicScores
      .filter(s => s.accuracy < 60)
      .map(s => ({
        topic: s.topic,
        subtopic: "System Identified",
        accuracy: s.accuracy,
        priority: s.accuracy < 40 ? 'High' : 'Medium',
        studyTip: `Your accuracy in ${s.topic} is below target. Revisit the core concepts and practice medium-difficulty problems.`
      }));

    return NextResponse.json({
      totalSolved,
      avgScore,
      eloRank: avgElo,
      streak,
      level: avgScore > 80 ? 'Expert' : avgScore > 50 ? 'Intermediate' : 'Beginner',
      topicScores,
      dailyData,
      weakTopics
    });

  } catch (error: any) {
    console.error('FIREBASE STATS ERROR:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message }, 
      { status: 500 }
    );
  }
}

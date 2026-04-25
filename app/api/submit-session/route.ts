import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';
import { updateSkillScore } from '../../../src/lib/eloRating';

interface SessionResult {
  questionText: string;
  options: Record<string, string>;
  correctOption: string;
  studentAnswer: string;
  isCorrect: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  aiExplanation: string;
  topic: string;
  subtopic: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, topic, subtopic = 'General', examType, results } = body;

    if (!userId || !topic || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'userId, topic, and results are required' }, { status: 400 });
    }

    // 1. Update Skill Scores in Firestore
    const scoreDocId = `${userId}_${topic}_${subtopic}`.replace(/\//g, '_');
    const scoreRef = adminDb.collection('skill_scores').doc(scoreDocId);
    const scoreSnap = await scoreRef.get();
    
    const currentData = scoreSnap.data();
    const originalScore = currentData?.skill_score || 1200;
    let newScore = originalScore;
    let newCorrect = 0;

    for (const result of results as SessionResult[]) {
      newScore = updateSkillScore(newScore, result.isCorrect, result.difficulty);
      if (result.isCorrect) newCorrect++;
    }

    const finalTotal = (currentData?.total_questions || 0) + results.length;
    const finalCorrect = (currentData?.correct_count || 0) + newCorrect;

    await scoreRef.set({
      user_id: userId,
      topic,
      subtopic,
      skill_score: newScore,
      total_questions: finalTotal,
      correct_count: finalCorrect,
      last_practiced: new Date().toISOString()
    }, { merge: true });

    // 2. Save Session Record
    const sessionRef = adminDb.collection('sessions').doc();
    await sessionRef.set({
      user_id: userId,
      topic,
      exam_type: examType,
      total_questions: results.length,
      correct_count: newCorrect,
      created_at: new Date().toISOString()
    });

    // 3. Save detailed responses
    const batch = adminDb.batch();
    results.forEach((r: SessionResult) => {
      const respRef = adminDb.collection('question_responses').doc();
      batch.set(respRef, {
        session_id: sessionRef.id,
        user_id: userId,
        ...r,
        created_at: new Date().toISOString()
      });
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      newSkillScore: newScore,
      skillDelta: newScore - originalScore
    });

  } catch (error: any) {
    console.error("Firebase submit error:", error);
    return NextResponse.json({ error: 'Failed to process session submit' }, { status: 500 });
  }
}

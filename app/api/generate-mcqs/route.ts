import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';
import { buildMCQPrompt, ExamType } from '../../../src/lib/prompts/mcqGenerator';
import { ChatGroq } from '@langchain/groq';

const llm = new ChatGroq({
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,
  apiKey: process.env.GROQ_API_KEY,
  maxTokens: 8000
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { content, topic, examType, userId, count = 10 } = body;
    console.log("Generating MCQs for:", { topic, examType, userId, contentLength: content?.length });

    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    // Safety: Truncate very long content to avoid Groq rate limits (12k TPM)
    if (content && content.length > 15000) {
      console.log("Truncating large content to 15000 chars");
      content = content.substring(0, 15000) + "... [Truncated for processing Speed]";
    }

    let skillScore = 1200;

    if (userId) {
      try {
        const scoreDocId = `${userId}_${topic}_General`.replace(/\//g, '_');
        const scoreSnap = await adminDb.collection('skill_scores').doc(scoreDocId).get();
        if (scoreSnap.exists) {
          skillScore = scoreSnap.data()?.skill_score || 1200;
        }
        console.log("Found skill score:", skillScore);
      } catch (dbErr) {
        console.error("Firestore lookup error (continuing with default):", dbErr);
      }
    }

    const prompt = buildMCQPrompt({
      content,
      topic,
      examType: examType as ExamType,
      skillScore,
      count
    });

    console.log("Invoking Groq LLM...");
    const response = await llm.invoke(prompt);
    const textContent = response.content as string;
    console.log("LLM Response received (length):", textContent.length);
    if (textContent.length < 100) console.log("Short LLM Response:", textContent);
    
    let questions = [];
    try {
      questions = JSON.parse(textContent);
      console.log("Successfully parsed JSON directly. Count:", questions.length);
    } catch (parseErr: any) {
      console.log("Direct JSON parse failed, trying regex extraction...");
      const match = textContent.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          questions = JSON.parse(match[0]);
          console.log("Successfully parsed JSON via regex. Count:", questions.length);
        } catch (regexErr: any) {
          console.error("Regex JSON parse failed:", regexErr.message);
        }
      } else {
        console.error("No JSON array found in LLM response");
      }
    }

    return NextResponse.json({
      questions,
      sessionMeta: { topic, examType, skillScore, generatedAt: new Date().toISOString() }
    });

  } catch (error: any) {
    console.error("MCQ Generation Error:", error.message || error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

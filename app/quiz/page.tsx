'use client';

import React, { useState } from 'react';
import { FileUploader } from '../../components/FileUploader';
import { QuizCard, Question } from '../../components/QuizCard';
import { useQuizStore } from '../../store/useQuizStore';
import { auth } from '../../lib/firebase';

type QuizStep = 'upload' | 'generating' | 'quiz' | 'finished';

export default function PracticePage() {
  const [step, setStep] = useState<QuizStep>('upload');
  const [examType, setExamType] = useState<'JEE' | 'UPSC'>('JEE');
  const [topic, setTopic] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Store actions
  const { 
    questions, 
    setQuestions, 
    currentQuestionIndex, 
    nextQuestion, 
    answers, 
    answerQuestion,
    resetSession,
    startSession
  } = useQuizStore();

  const handleStartGeneration = async (text: string) => {
    if (!topic) {
      setError("Please specify a topic first.");
      return;
    }
    
    setExtractedText(text);
    setStep('generating');
    setError(null);

    try {
      const response = await fetch('/api/generate-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: text, 
          topic, 
          examType,
          count: 5 
        })
      });

      if (!response.ok) throw new Error("Failed to generate MCQs");
      
      const data = await response.json();
      setQuestions(data.questions);
      startSession();
      setStep('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating quiz");
      setStep('upload');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleFinish = async () => {
    setStep('finished');
    const user = auth.currentUser;

    if (user) {
      const results = questions.map((q, i) => ({
        questionText: q.question,
        options: q.options,
        correctOption: q.correct,
        studentAnswer: answers[q.id] || '',
        isCorrect: answers[q.id] === q.correct,
        difficulty: (q.difficulty as any) || 'Medium',
        aiExplanation: q.explanation,
        topic: q.topic,
        subtopic: 'General'
      }));

      await fetch('/api/submit-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          topic,
          examType,
          results
        })
      });
    }
  };

  if (step === 'upload') {
    return (
      <div className="max-w-4xl mx-auto space-y-10 py-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-gray-900">Create a New Practice Quiz</h1>
          <p className="text-gray-500 text-lg">Upload your notes or text, and we'll generate personalized MCQs based on your level.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Exam Target</label>
              <select 
                value={examType}
                onChange={(e) => setExamType(e.target.value as 'JEE' | 'UPSC')}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="JEE">JEE (Engineering)</option>
                <option value="UPSC">UPSC (Civil Services)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Syllabus Topic</label>
              <input 
                type="text"
                placeholder="e.g., Organic Chemistry"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-700">Upload Study Material (PDF/Image)</label>
            <FileUploader 
              onTextExtracted={(text) => {
                setExtractedText(text);
                setError(null);
              }} 
              onError={(msg) => setError(msg)} 
            />
          </div>

          {extractedText && !error && (
            <div className="pt-4 border-t border-gray-100">
               <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                 <div className="bg-indigo-600 rounded-full p-1">
                   <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                 </div>
                 <p className="text-indigo-900 font-semibold text-sm">Study material processed successfully!</p>
               </div>
               
               <button 
                 onClick={() => handleStartGeneration(extractedText)}
                 className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 transition-all hover:-translate-y-1"
               >
                 Generate Practice Quiz
               </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-600">AI</div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Analyzing your material...</h2>
          <p className="text-gray-500">Generating hyper-relevant questions using Groq Flash.</p>
        </div>
      </div>
    );
  }

  if (step === 'quiz') {
    if (!questions || questions.length === 0) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">No Questions Generated</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            The AI couldn't generate valid questions from the selected material. Please try a different topic or shorter notes.
          </p>
          <button 
            onClick={() => setStep('upload')}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition"
          >
            Go Back & Retry
          </button>
        </div>
      );
    }

    if (currentQuestion) {
      return (
        <div className="py-10">
          <QuizCard 
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            total={questions.length}
            onAnswer={(opt) => answerQuestion(currentQuestion.id, opt)}
            onNext={() => {
              if (currentQuestionIndex === questions.length - 1) {
                handleFinish();
              } else {
                nextQuestion();
              }
            }}
          />
        </div>
      );
    }
  }

  if (step === 'finished') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold text-gray-900">Quiz Completed!</h2>
          <p className="text-gray-500 text-lg">Your results have been saved and your Skill Score updated.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              resetSession();
              setStep('upload');
            }}
            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition"
          >
            Practice Again
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="px-8 py-4 bg-white text-gray-700 border border-gray-200 font-bold rounded-2xl hover:bg-gray-50 transition"
          >
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}

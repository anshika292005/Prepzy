'use client';

import React, { useState, useEffect } from 'react';
import { FileUploader } from '../../components/FileUploader';
import { QuizCard, Question } from '../../components/QuizCard';
import { useQuizStore } from '../../store/useQuizStore';
import { auth } from '../../lib/firebase';
import Script from 'next/script';
import { ChevronRight, Target, BookOpen, FileUp, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

type QuizStep = 'exam' | 'syllabus' | 'material' | 'generating' | 'quiz' | 'finished';

export default function PracticePage() {
  const [step, setStep] = useState<QuizStep>('exam');
  const [examType, setExamType] = useState<'JEE' | 'UPSC'>('JEE');
  const [topic, setTopic] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset topic if exam target changes
  useEffect(() => {
    setTopic('');
  }, [examType]);

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

  const steps_info = [
    { id: 'exam', label: 'Target', icon: <Target className="w-5 h-5" /> },
    { id: 'syllabus', label: 'Syllabus', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'material', label: 'Material', icon: <FileUp className="w-5 h-5" /> },
  ];

  const handleStartGeneration = async () => {
    if (!extractedText) {
      setError("Please upload study material first.");
      return;
    }
    
    setStep('generating');
    setError(null);

    try {
      const response = await fetch('/api/generate-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: extractedText, 
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
      setStep('material');
    }
  };

  const handleFinish = async () => {
    setStep('finished');
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          topic,
          examType,
          results
        })
      });
    }
  };

  const renderStepIndicator = () => {
    if (['generating', 'quiz', 'finished'].includes(step)) return null;
    
    return (
      <div className="flex items-center justify-center mb-12">
        {steps_info.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center relative">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                step === s.id 
                ? 'bg-[#3B5CFF] text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50' 
                : steps_info.findIndex(x => x.id === step) > i 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                : 'bg-white text-slate-400 border border-slate-100'
              }`}>
                {steps_info.findIndex(x => x.id === step) > i ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
              </div>
              <span className={`absolute -bottom-7 text-[12px] font-bold uppercase tracking-widest whitespace-nowrap ${
                step === s.id ? 'text-[#3B5CFF]' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps_info.length - 1 && (
              <div className={`w-20 h-[2px] mx-4 rounded-full transition-colors duration-500 ${
                steps_info.findIndex(x => x.id === step) > i ? 'bg-emerald-500' : 'bg-slate-100'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 'exam':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">What's your goal?</h2>
              <p className="text-slate-500">Select the exam you're preparing for to customize your experience.</p>
              <div className="flex justify-center -mt-8 -mb-12">
                <div className="w-72 h-72">
                  <dotlottie-wc 
                    key="exam-animation"
                    src="https://lottie.host/af31a255-e626-4cac-9aca-d389b85a2a84/G71rCvkaXw.lottie" 
                    autoplay 
                    loop 
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                { id: 'JEE', name: 'JEE Main & Advanced', desc: 'Engineering Entrance', icon: '/images/cbse-logo.png' },
                { id: 'UPSC', name: 'UPSC Civil Services', desc: 'Civil Services Exam', icon: '/images/upsc-logo.jpg' }
              ].map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => setExamType(exam.id as any)}
                  className={`group bg-[#F9FAFB] p-6 rounded-xl border transition-all duration-200 text-center flex flex-col items-center gap-4 ${
                    examType === exam.id 
                    ? 'border-[#3B5CFF] bg-white shadow-lg shadow-blue-50 ring-1 ring-blue-100' 
                    : 'border-slate-200 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white flex items-center justify-center p-2 border border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                    <img src={exam.icon} alt={exam.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-bold text-[#2D3748] mb-1">{exam.name}</h4>
                    <p className="text-slate-500 text-[13px] font-medium leading-tight">{exam.desc}</p>
                  </div>
                  <div className={`mt-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                    examType === exam.id ? 'border-[#3B5CFF] bg-[#3B5CFF]' : 'border-slate-200'
                  }`}>
                    {examType === exam.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setStep('syllabus')}
              className="w-full max-w-2xl mx-auto py-4 bg-[#3B5CFF] text-white rounded-xl font-bold text-[16px] shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-600 transition-all duration-200 group"
            >
              Continue to Syllabus <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        );

      case 'syllabus':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">Define the Syllabus</h2>
              <p className="text-slate-500">Tell us which topic you want to master today.</p>
              <div className="flex justify-center -mt-8 -mb-12">
                <div className="w-72 h-72">
                  <dotlottie-wc 
                    key="syllabus-animation"
                    src="https://lottie.host/b63b029a-6842-424b-b100-b291608f00a0/RSWNmcQbB3.lottie" 
                    autoplay 
                    loop 
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            </div>
            <div className="bg-[#F9FAFB] p-6 rounded-xl border border-slate-200 transition-all duration-200 hover:bg-white hover:shadow-sm space-y-4 max-w-xl mx-auto">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2D3748] ml-1 uppercase tracking-widest text-[10px]">Topic / Subject</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <input 
                    type="text"
                    placeholder="e.g., Quantum Mechanics"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#3B5CFF] transition-all text-[16px] font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(examType === 'JEE' 
                  ? ['Physics', 'Chemistry', 'Mathematics', 'Organic Chem', 'Mechanics'] 
                  : ['History', 'Polity', 'Economics', 'Geography', 'Current Affairs']
                ).map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setTopic(tag)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                      topic === tag 
                      ? 'bg-[#3B5CFF] text-white border-[#3B5CFF]' 
                      : 'bg-[#3B5CFF]/5 text-[#3B5CFF] border-[#3B5CFF]/10 hover:bg-[#3B5CFF]/10 hover:border-[#3B5CFF]/20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 max-w-xl mx-auto w-full">
              <button 
                onClick={() => setStep('exam')}
                className="flex-1 py-4 bg-[#3B5CFF]/10 text-[#3B5CFF] border border-[#3B5CFF]/20 rounded-xl font-bold text-[15px] hover:bg-[#3B5CFF] hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={() => topic ? setStep('material') : setError("Please enter a topic")}
                className="flex-[2] py-4 bg-[#3B5CFF] text-white rounded-xl font-bold text-[15px] shadow-lg shadow-blue-50 flex items-center justify-center gap-2 hover:bg-blue-600 transition-all group"
              >
                Next Step <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        );

      case 'material':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">Upload Your Material</h2>
              <p className="text-slate-500">Our AI will generate questions directly from your notes or files.</p>
              <div className="flex justify-center -mt-8 -mb-12">
                <div className="w-72 h-72">
                  <dotlottie-wc 
                    key="material-animation"
                    src="https://lottie.host/5f178ce9-e3e4-4450-93f5-73d5e7561c54/5qvJTBvrmq.lottie" 
                    autoplay 
                    loop 
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            </div>
            <div className="bg-[#F9FAFB] p-1 rounded-xl border border-slate-200 transition-all duration-200 hover:bg-white hover:shadow-sm overflow-hidden max-w-xl mx-auto">
              <FileUploader 
                onTextExtracted={(text) => {
                  setExtractedText(text);
                  setError(null);
                }} 
                onError={(msg) => setError(msg)} 
              />
            </div>
            
            {extractedText && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4 animate-in zoom-in-95 duration-300">
                <div className="bg-emerald-500 rounded-full p-2 text-white shadow-lg shadow-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-emerald-900 font-bold">Material Processed!</p>
                  <p className="text-emerald-700 text-sm">We're ready to create your custom quiz.</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 max-w-xl mx-auto w-full">
              <button 
                onClick={() => setStep('syllabus')}
                className="flex-1 py-4 bg-[#3B5CFF]/10 text-[#3B5CFF] border border-[#3B5CFF]/20 rounded-xl font-bold text-[15px] hover:bg-[#3B5CFF] hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleStartGeneration}
                disabled={!extractedText}
                className={`flex-[2] py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all ${
                  extractedText 
                  ? 'bg-[#3B5CFF] text-white shadow-lg shadow-blue-50 hover:bg-blue-600 group' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Generate Quiz <ArrowRight className={`w-4 h-4 transition-transform ${extractedText ? 'group-hover:translate-x-1' : ''}`} />
              </button>
            </div>
          </div>
        );

      case 'generating':
        return (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
             <div className="w-48 h-48 relative">
                <dotlottie-wc 
                  src="https://lottie.host/d361cba7-f410-46ab-a19b-16e0ea0bff55/gffpnvslfy.lottie" 
                  autoplay 
                  loop 
                  style={{ width: '100%', height: '100%' }}
                />
             </div>
             <div className="space-y-3">
                <h2 className="text-3xl font-bold text-slate-900">Crafting Your Challenge</h2>
                <p className="text-slate-500 max-w-sm mx-auto text-lg">AI is analyzing your material to generate hyper-relevant practice questions...</p>
             </div>
             <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#3B5CFF] animate-progress" style={{ width: '60%' }}></div>
             </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <QuizCard 
              question={questions[currentQuestionIndex]}
              questionNumber={currentQuestionIndex + 1}
              total={questions.length}
              onAnswer={(opt) => answerQuestion(questions[currentQuestionIndex].id, opt)}
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

      case 'finished':
        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-10 animate-in zoom-in-95 duration-500">
            <div className="w-32 h-32 bg-emerald-50 rounded-[3rem] flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-50">
              <CheckCircle2 className="w-16 h-16" strokeWidth={2.5} />
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-slate-900 tracking-tight">Mission Success!</h2>
              <p className="text-slate-500 text-xl font-medium max-w-md mx-auto">
                Great job! Your performance has been synced to your dashboard and your Elo rank updated.
              </p>
            </div>
            <div className="flex gap-4 w-full max-w-md">
              <button 
                onClick={() => {
                  resetSession();
                  setStep('exam');
                }}
                className="flex-1 py-5 bg-[#3B5CFF] text-white font-bold rounded-3xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-100"
              >
                Try Another Topic
              </button>
              <button 
                onClick={() => window.location.href = '/home'}
                className="flex-1 py-5 bg-white text-slate-700 border border-slate-200 font-bold rounded-3xl hover:bg-slate-50 transition-all"
              >
                Return Home
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
      
      {renderStepIndicator()}

      <div className="mt-8">
        {renderCurrentStep()}
      </div>

      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md animate-in slide-in-from-bottom-10 duration-500">
          <div className="mx-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 shadow-2xl flex items-center gap-3">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
             <p className="text-sm font-bold">{error}</p>
             <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}

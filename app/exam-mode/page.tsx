'use client';

import React, { useState, useEffect, useRef } from 'react';

type ExamType = 'JEE' | 'UPSC';

interface Question {
  id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: string;
  topic: string;
}

type ScreenState = 'setup' | 'exam' | 'results';

export default function ExamModePage() {
  const [screen, setScreen] = useState<ScreenState>('setup');
  
  // Setup State
  const [topic, setTopic] = useState('');
  const [examType, setExamType] = useState<ExamType>('JEE');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Exam State
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Results State
  const [scoreCounts, setScoreCounts] = useState({ correct: 0, wrong: 0, unattempted: 0 });
  const [marks, setMarks] = useState(0);

  // -- SCREEN 1: Setup Logic --

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please enter a topic.');
      return;
    }
    setErrorMsg('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, examType, count: 10 })
      });

      if (!res.ok) {
        throw new Error('Generation failed');
      }

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions generated');
      }

      setQuestions(data.questions);
      setAnswers({});
      setMarkedForReview(new Set());
      setCurrentIndex(0);
      setTimeLeft(examType === 'JEE' ? 5400 : 7200);
      setScreen('exam');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  // -- SCREEN 2: Exam Logic --

  useEffect(() => {
    if (screen === 'exam' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]); // Explicitly don't add timeLeft to dependency array to prevent rapid re-binds that break timer accuracy

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentQ = questions[currentIndex];

  const handleSelectOption = (key: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: key }));
  };

  const toggleReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) newSet.delete(currentIndex);
      else newSet.add(currentIndex);
      return newSet;
    });
  };

  const handleSubmitExam = () => {
    if (timeLeft > 0 && screen === 'exam') {
      const confirmed = window.confirm("Are you sure you want to submit your exam?");
      if (!confirmed) return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    let cCount = 0;
    let wCount = 0;
    let uCount = 0;

    questions.forEach((q, i) => {
      const ans = answers[i];
      if (!ans) {
        uCount++;
      } else if (ans === q.correct) {
        cCount++;
      } else {
        wCount++;
      }
    });

    setScoreCounts({ correct: cCount, wrong: wCount, unattempted: uCount });

    if (examType === 'JEE') {
      setMarks(cCount * 4 - wCount * 1);
    } else {
      setMarks(Number((cCount * 2 - wCount * 0.66).toFixed(2)));
    }

    setScreen('results');
  };

  // -- RENDERERS --

  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-indigo-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white text-center tracking-wide">Exam Mode Simulator</h1>
          </div>
          <div className="p-8 space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Exam Target</label>
              <select 
                value={examType} 
                onChange={e => setExamType(e.target.value as ExamType)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              >
                <option value="JEE">JEE (90 mins)</option>
                <option value="UPSC">UPSC (120 mins)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Syllabus Topic</label>
              <input 
                type="text" 
                placeholder="e.g., Indian Economy, Rotational Mechanics" 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>

            {errorMsg && <p className="text-red-500 text-sm font-medium">{errorMsg}</p>}

            <button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="w-full py-4 rounded-lg font-bold text-white uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {isGenerating ? 'Generating 30 Questions...' : 'Generate Exam Paper'}
            </button>
            <p className="text-center text-xs justify-center text-gray-400">
              * The timer begins instantly upon generation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'exam') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header Bar */}
        <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0 z-10 sticky top-0">
          <div>
            <h1 className="text-xl font-bold">{topic}</h1>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{examType} FULL TEST</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2 text-xl font-mono text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(timeLeft)}
            </div>
            <button 
              onClick={handleSubmitExam} 
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Submit Exam
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Question Area */}
          <main className="flex-1 p-6 md:p-10 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-8">
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-indigo-600 border-b-2 border-indigo-600 pb-1">
                  Question {currentIndex + 1}
                </span>
                <button 
                  onClick={toggleReview}
                  className={`text-sm font-semibold px-4 py-2 rounded-lg transition border ${
                    markedForReview.has(currentIndex) 
                    ? 'bg-purple-100 text-purple-700 border-purple-200' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {markedForReview.has(currentIndex) ? '★ Marked for Review' : '☆ Mark for Review'}
                </button>
              </div>

              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 leading-relaxed">
                {currentQ.question}
              </h2>

              <div className="space-y-3">
                {(Object.entries(currentQ.options) as [string, string][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => handleSelectOption(key)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      answers[currentIndex] === key 
                      ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-sm ${
                        answers[currentIndex] === key ? 'border-indigo-600 text-indigo-600' : 'border-gray-400 text-gray-500'
                      }`}>
                        {key}
                      </span>
                      <span className="text-gray-800 text-lg">{val}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-gray-200 mt-10">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  &larr; Previous
                </button>
                <button
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="px-8 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Save & Next &rarr;
                </button>
              </div>
            </div>
          </main>

          {/* Navigator Sidebar */}
          <aside className="w-full md:w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto shrink-0 shadow-[-10px_0_20px_rgba(0,0,0,0.03)] z-0">
            <h3 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Question Navigator</h3>
            
            <div className="grid grid-cols-5 gap-3">
              {questions.map((_, i) => {
                let pillClass = "border-gray-200 bg-white text-gray-600";
                
                if (markedForReview.has(i)) {
                  pillClass = "border-purple-300 text-white bg-purple-500";
                } else if (answers[i]) {
                  pillClass = "border-green-300 text-white bg-green-500";
                }

                if (i === currentIndex) {
                  pillClass += " ring-4 ring-indigo-200 scale-110 shadow-lg"; 
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-10 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-all ${pillClass}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-10 space-y-3 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-5 h-5 rounded border-2 border-green-300 bg-green-500"></div> Answered
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-5 h-5 rounded border-2 border-purple-300 bg-purple-500"></div> Marked Review
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-5 h-5 rounded border-2 border-gray-200 bg-white"></div> Unanswered
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // SCREEN 3: RESULTS
  const totalAcc = questions.length > 0 ? Math.round((scoreCounts.correct / questions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 lg:p-12 items-center">
      <div className="w-full max-w-5xl space-y-8">
        
        {/* Header Results Area */}
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-100 flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Exam Results</h1>
          <p className="text-gray-500 font-medium mb-10">{topic} • {examType}</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-10">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <p className="text-sm font-bold text-gray-400 uppercase">Calculated Marks</p>
              <p className="text-4xl font-black text-indigo-600 mt-2">{marks}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <p className="text-sm font-bold text-green-700 uppercase">Correct</p>
              <p className="text-4xl font-black text-green-600 mt-2">{scoreCounts.correct}</p>
            </div>
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
              <p className="text-sm font-bold text-red-700 uppercase">Incorrect</p>
              <p className="text-4xl font-black text-red-600 mt-2">{scoreCounts.wrong}</p>
            </div>
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
              <p className="text-sm font-bold text-amber-700 uppercase">Unattempted</p>
              <p className="text-4xl font-black text-amber-600 mt-2">{scoreCounts.unattempted}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center w-full max-w-md">
            <div className="flex justify-between w-full mb-2">
              <span className="font-bold text-gray-700">Overall Accuracy</span>
              <span className="font-bold text-indigo-600">{totalAcc}%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${totalAcc}%` }}></div>
            </div>
            
            <button 
              onClick={() => setScreen('setup')}
              className="mt-12 px-8 py-4 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-black transition w-full"
            >
              Take Another Test
            </button>
          </div>
        </div>

        {/* Breakdown section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 ml-4">Detailed Breakdown</h2>
          
          {questions.map((q, i) => {
            const studentAns = answers[i] || 'None';
            const isCorrect = studentAns === q.correct;
            
            return (
              <div key={i} className={`bg-white rounded-2xl p-8 border-2 shadow-sm ${
                isCorrect ? 'border-green-200' : 'border-red-200'
              }`}>
                <div className="flex items-start gap-4 mb-6">
                  <div className={`mt-1 shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-white font-bold text-sm ${
                    isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 leading-relaxed">{q.question}</h3>
                </div>

                <div className="ml-12 grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Your Answer</p>
                    <p className={`font-semibold text-lg ${
                      studentAns === 'None' ? 'text-gray-400' : (isCorrect ? 'text-green-600' : 'text-red-500')
                    }`}>
                      {studentAns !== 'None' ? `${studentAns}) ${q.options[studentAns as keyof typeof q.options]}` : 'Unattempted'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                    <p className="text-xs font-bold text-green-700/50 uppercase tracking-wider mb-1">Correct Answer</p>
                    <p className="font-semibold text-lg text-green-700">
                      {q.correct}) {q.options[q.correct]}
                    </p>
                  </div>
                </div>

                <div className="ml-12 p-5 bg-gray-50 rounded-xl border border-gray-200 relative">
                  <span className="absolute -top-3 left-4 bg-gray-200 px-3 py-1 rounded-full text-xs font-bold text-gray-600 uppercase">
                    Explanation
                  </span>
                  <p className="text-gray-700 leading-relaxed mt-2">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

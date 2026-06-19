'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { 
  ArrowRight, 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  AlertCircle,
  Timer,
  LayoutDashboard,
  BrainCircuit,
  Trophy,
  History,
  XCircle,
  CheckCircle,
  ShieldCheck,
  Zap,
  Target,
  ChevronDown,
  Search,
  ChevronRight
} from 'lucide-react';

type ExamType = 'JEE' | 'UPSC' | 'NEET' | 'CAT' | 'GATE' | 'SSC' | 'CLASS10' | 'CLASS12' | 'CLAT' | 'NDA';
type Step = 'exam' | 'syllabus' | 'start';
type ScreenState = 'setup' | 'initializing' | 'exam' | 'results';

interface ExamData {
  id: ExamType;
  name: string;
  fullName: string;
  desc: string;
  duration: number;
  marking: string;
  logo: string;
}

const EXAMS: ExamData[] = [
  { id: 'JEE', name: 'JEE Advanced', fullName: 'Joint Entrance Examination', desc: 'Engineering Simulator • 4/-1 Scheme', duration: 5400, marking: '4/-1', logo: '/images/cbse-logo.png' },
  { id: 'UPSC', name: 'UPSC CSE', fullName: 'Union Public Service Commission', desc: 'Civil Services Simulator • 2/-0.66 Scheme', duration: 7200, marking: '2/-0.66', logo: '/images/upsc-logo.jpg' },
  { id: 'NEET', name: 'NEET UG', fullName: 'National Eligibility cum Entrance Test', desc: 'Medical Simulator • 4/-1 Scheme', duration: 10800, marking: '4/-1', logo: '/images/neet-logo.jpg' },
  { id: 'CLASS10', name: 'Class 10 Board', fullName: 'Secondary School Examination', desc: 'Board Exam Simulator • 80 Marks', duration: 10800, marking: '1/0', logo: '/images/cbse-logo.png' },
  { id: 'CLASS12', name: 'Class 12 Board', fullName: 'Senior Secondary Examination', desc: 'Board Exam Simulator • 100 Marks', duration: 10800, marking: '1/0', logo: '/images/cbse-logo.png' },
  { id: 'CAT', name: 'CAT', fullName: 'Common Admission Test', desc: 'Management Simulator • 3/-1 Scheme', duration: 7200, marking: '3/-1', logo: '/images/cat-logo.jpg' },
  { id: 'GATE', name: 'GATE', fullName: 'Graduate Aptitude Test in Engineering', desc: 'Tech Simulator • 1/2/-0.66 Scheme', duration: 10800, marking: '2/-0.66', logo: '/images/gate-logo.png' },
  { id: 'SSC', name: 'SSC CGL', fullName: 'Staff Selection Commission', desc: 'Govt Simulator • 2/-0.5 Scheme', duration: 3600, marking: '2/-0.5', logo: '/images/ssc-logo.png' },
  { id: 'CLAT', name: 'CLAT', fullName: 'Common Law Admission Test', desc: 'Law Simulator • 1/-0.25 Scheme', duration: 7200, marking: '1/-0.25', logo: '/images/clat-logo.png' },
  { id: 'NDA', name: 'NDA', fullName: 'National Defence Academy', desc: 'Defence Simulator • 2.5/-0.83 Scheme', duration: 9000, marking: '2.5/-0.83', logo: '/images/upsc-logo.jpg' }
];

interface Question {
  id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: string;
  topic: string;
}

export default function ExamModePage() {
  const [screen, setScreen] = useState<ScreenState>('setup');
  const [step, setStep] = useState<Step>('exam');
  
  // Setup State
  const [topic, setTopic] = useState('');
  const [examType, setExamType] = useState<ExamType>('JEE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Exam State
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Results State
  const [scoreCounts, setScoreCounts] = useState({ correct: 0, wrong: 0, unattempted: 0 });
  const [marks, setMarks] = useState(0);

  const selectedExam = EXAMS.find(e => e.id === examType) || EXAMS[0];

  useEffect(() => {
    setTopic('');
  }, [examType]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setScreen('initializing');

    try {
      const res = await fetch('/api/generate-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, examType, count: 20 })
      });

      if (!res.ok) throw new Error('Failed to generate exam paper');

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) throw new Error('No questions generated');

      setQuestions(data.questions);
      setAnswers({});
      setMarkedForReview(new Set());
      setCurrentIndex(0);
      setTimeLeft(selectedExam.duration);
      
      // Small delay to let user see the animation
      setTimeout(() => {
        setScreen('exam');
        setIsGenerating(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setScreen('setup');
      setStep('start');
      setIsGenerating(false);
    }
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

    let finalMarks = 0;
    if (examType === 'JEE' || examType === 'NEET') {
      finalMarks = cCount * 4 - wCount * 1;
    } else if (examType === 'CAT') {
      finalMarks = cCount * 3 - wCount * 1;
    } else if (examType === 'SSC') {
      finalMarks = cCount * 2 - wCount * 0.5;
    } else if (examType === 'NDA') {
      finalMarks = Number((cCount * 2.5 - wCount * 0.83).toFixed(2));
    } else if (examType === 'CLASS10' || examType === 'CLASS12') {
      finalMarks = cCount;
    } else {
      finalMarks = Number((cCount * 2 - wCount * 0.66).toFixed(2));
    }
    setMarks(finalMarks);

    // Sync to Database
    const syncResults = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      try {
        const results = questions.map((q, i) => ({
          questionText: q.question,
          options: q.options,
          correctOption: q.correct,
          studentAnswer: answers[i] || '',
          isCorrect: answers[i] === q.correct,
          difficulty: (q.difficulty as any) || 'Medium',
          aiExplanation: q.explanation,
          topic: q.topic || topic,
          subtopic: 'Exam Mode'
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
      } catch (err) {
        console.error("Failed to sync exam results:", err);
      }
    };

    syncResults();
    setScreen('results');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
  }, [screen]);

  const filteredExams = EXAMS.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStepIndicator = () => {
    const steps_info = [
      { id: 'exam', label: 'PROTOCOL', icon: Target },
      { id: 'syllabus', label: 'VECTORS', icon: Zap },
      { id: 'start', label: 'LAUNCH', icon: ShieldCheck }
    ];

    return (
      <div className="flex items-center justify-center mb-10">
        {steps_info.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                step === s.id 
                ? 'bg-[#3B5CFF] text-white shadow-lg shadow-blue-200' 
                : steps_info.findIndex(x => x.id === step) > i 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-slate-300 border border-slate-200'
              }`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className={`text-[8px] font-black mt-2 tracking-[0.2em] ${
                step === s.id ? 'text-[#3B5CFF]' : 'text-slate-400'
              }`}>{s.label}</span>
            </div>
            {i < steps_info.length - 1 && (
              <div className={`w-12 h-[1px] mx-3 rounded-full transition-colors duration-500 ${
                steps_info.findIndex(x => x.id === step) > i ? 'bg-[#3B5CFF]' : 'bg-slate-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderSetup = () => {
    switch (step) {
      case 'exam':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Select Target Exam</h2>
              <p className="text-slate-500 font-medium text-sm">Initialize the simulator with your target assessment protocol.</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search exams (JEE, NEET, Boards...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-6 py-3 bg-[#F9FAFB] border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExams.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => {
                      setExamType(exam.id);
                      setStep('syllabus');
                    }}
                    className={`group bg-[#F9FAFB] p-5 rounded-xl border transition-all duration-200 flex items-start gap-4 text-left hover:bg-white hover:shadow-sm ${
                      examType === exam.id ? 'border-[#3B5CFF] ring-2 ring-blue-50' : 'border-slate-200'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center p-2 shadow-sm transition-transform group-hover:scale-105">
                        <img src={exam.logo} alt={exam.name} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-[#2D3748] text-[15px] tracking-tight">{exam.name}</h3>
                        <ChevronRight className={`w-3.5 h-3.5 transition-colors ${examType === exam.id ? 'text-[#3B5CFF]' : 'text-slate-400'}`} />
                      </div>
                      <p className="text-[13px] text-[#718096] font-normal leading-tight mt-1 line-clamp-1">
                        {exam.fullName}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                         <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                           {exam.marking} MARKING
                         </span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           {exam.duration / 60} MINS
                         </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'syllabus':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Focus Parameters</h2>
              <p className="text-slate-500 font-medium">Define the core subject area for the current simulation run.</p>
            </div>

            <div className="max-w-xl mx-auto space-y-8">
              <div className="bg-[#F9FAFB] p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Subject Vector</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Enter specific topic..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#3B5CFF] focus:ring-2 focus:ring-blue-50 transition-all text-base font-bold text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(examType === 'JEE' || examType === 'NEET' || examType === 'GATE' || examType.includes('CLASS')
                    ? ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'] 
                    : ['History', 'Polity', 'Economics', 'General Awareness']
                  ).map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setTopic(tag)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all border ${
                        topic === tag 
                        ? 'bg-[#3B5CFF] text-white border-[#3B5CFF] shadow-md shadow-blue-100' 
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
                      }`}
                    >
                      {tag.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep('exam')}
                  className="flex-1 py-4 bg-white text-slate-400 border border-slate-200 rounded-xl font-black text-[10px] tracking-widest hover:bg-slate-50 transition-all"
                >
                  PREVIOUS
                </button>
                <button 
                  onClick={() => topic ? setStep('start') : setError("Vector definition required")}
                  className="flex-[2] py-4 bg-[#3B5CFF] text-white rounded-xl font-black text-[10px] tracking-[0.2em] shadow-lg shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-600 transition-all group"
                >
                  CONTINUE <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'start':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Final Authorization</h2>
              <p className="text-slate-500 font-medium">Verify your simulation settings. The timer is ready for activation.</p>
            </div>
            
            <div className="max-w-xl mx-auto bg-[#3B5CFF] rounded-[2rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-5 pb-6 border-b border-white/10">
                   <div className="w-14 h-14 rounded-xl bg-white p-2 border border-white/20">
                     <img src={selectedExam.logo} alt={selectedExam.name} className="w-full h-full object-contain" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.3em]">Authorized Protocol</p>
                     <p className="text-xl font-bold tracking-tight">{selectedExam.name}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.3em]">Subject</p>
                    <p className="text-lg font-bold tracking-tight truncate">{topic}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.3em]">Clock</p>
                    <p className="text-lg font-bold tracking-tight">{selectedExam.duration / 60}:00 Mins</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center gap-3 text-indigo-100">
                  <ShieldCheck className="w-5 h-5 opacity-80" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Environment Lockdown Ready</p>
                </div>
              </div>

              {/* Lottie Animation */}
              <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-64 h-64 opacity-100 pointer-events-none">
                <dotlottie-wc 
                  src="https://lottie.host/ec2e5d0d-4353-4469-9b08-067301a31692/S0VnUpR03S.lottie" 
                  autoplay 
                  loop 
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-400 rounded-full blur-3xl opacity-40" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            </div>

            <div className="flex gap-4 max-w-xl mx-auto w-full">
              <button 
                onClick={() => setStep('syllabus')}
                className="flex-1 py-4 bg-white text-slate-400 border border-slate-200 rounded-xl font-black text-[10px] tracking-widest hover:bg-slate-50 transition-all"
              >
                BACK
              </button>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-[3] py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] tracking-[0.3em] shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-black transition-all group disabled:opacity-50"
              >
                {isGenerating ? 'INITIALIZING...' : 'ACTIVATE SIMULATOR'}
              </button>
            </div>
            {error && (
              <p className="text-center text-red-500 font-bold text-sm">{error}</p>
            )}
          </div>
        );
    }
  };

  const renderInitializing = () => {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="w-64 h-64">
          <dotlottie-wc 
            src="https://lottie.host/2ace8e3f-4d04-4529-8b8c-2faa2e4a2e62/eLHbU7QT5j.lottie" 
            autoplay 
            loop 
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="mt-8 text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Initializing Simulator</h2>
          <p className="text-slate-500 font-medium animate-pulse">Establishing secure connection and generating vectors...</p>
        </div>
      </div>
    );
  };

  const renderExam = () => {
    const currentQ = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
        <div className="bg-[#3B5CFF] text-white sticky top-0 z-50 px-6 py-4 border-b border-white/10 shadow-xl shadow-blue-800/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                <span className="text-[9px] font-black tracking-[0.3em] uppercase text-indigo-100">Live Simulation</span>
              </div>
              <div className="h-6 w-[1px] bg-white/20" />
              <div className="flex items-center gap-3">
                 <img src={selectedExam.logo} alt="" className="w-6 h-6 object-contain invert brightness-200" />
                 <h1 className="text-sm font-bold tracking-tight">{topic.toUpperCase()} • {examType}</h1>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 font-mono text-2xl font-bold text-white tabular-nums">
                <Clock className="w-5 h-5 opacity-70" />
                {formatTime(timeLeft)}
              </div>
              <button 
                onClick={handleSubmitExam}
                className="bg-white text-[#3B5CFF] px-6 py-2 rounded-xl font-bold text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-lg shadow-blue-800/20"
              >
                SUBMIT EXAM
              </button>
            </div>
          </div>
        </div>

        <div className="w-full h-1 bg-blue-800">
          <div className="h-full bg-white transition-all duration-700 shadow-[0_0_8px_rgba(255,255,255,0.8)]" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 flex max-w-[1440px] mx-auto w-full px-6 py-6 gap-6 overflow-hidden">
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
            <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-slate-200">#{currentIndex + 1}</span>
                <span className="text-[9px] font-black text-[#3B5CFF] uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{currentQ.difficulty}</span>
              </div>
              <button 
                onClick={() => {
                  const newSet = new Set(markedForReview);
                  if (newSet.has(currentIndex)) newSet.delete(currentIndex);
                  else newSet.add(currentIndex);
                  setMarkedForReview(newSet);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[9px] tracking-widest uppercase transition-all border ${
                  markedForReview.has(currentIndex)
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                }`}
              >
                <History className="w-3 h-3" />
                Review
              </button>
            </div>

            <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden" key={currentIndex}>
              <h2 className="text-xl font-bold text-slate-900 leading-snug mb-10">
                {currentQ.question}
              </h2>

              <div className="grid grid-cols-1 gap-3">
                {(Object.entries(currentQ.options) as [string, string][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setAnswers({ ...answers, [currentIndex]: key })}
                    className={`w-full group p-5 rounded-xl border transition-all duration-200 text-left flex items-center gap-4 ${
                      answers[currentIndex] === key
                      ? 'border-[#3B5CFF] bg-blue-50/50 shadow-sm'
                      : 'border-slate-100 bg-[#F9FAFB] hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-bold transition-all ${
                      answers[currentIndex] === key
                      ? 'bg-[#3B5CFF] text-white scale-105'
                      : 'bg-white text-slate-400 group-hover:text-slate-900 border border-slate-200'
                    }`}>
                      {key}
                    </div>
                    <span className={`text-[15px] font-medium transition-colors ${
                      answers[currentIndex] === key ? 'text-slate-900' : 'text-[#718096] group-hover:text-slate-800'
                    }`}>{val}</span>
                  </button>
                ))}
              </div>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3B5CFF]" />
            </div>

            <div className="flex items-center justify-between pb-6">
              <button 
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="px-6 py-3 text-slate-400 font-bold text-xs tracking-widest hover:text-slate-900 disabled:opacity-30 transition-all flex items-center gap-2 group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> PREV
              </button>
              <button 
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-xs tracking-widest shadow-lg shadow-slate-200 hover:bg-black transition-all flex items-center gap-2 group disabled:opacity-30"
              >
                SAVE & NEXT <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="w-80 shrink-0 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Question Palette</h3>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-11 rounded-lg font-bold text-xs transition-all border flex items-center justify-center ${
                      i === currentIndex
                      ? 'border-[#3B5CFF] bg-[#3B5CFF] text-white shadow-md scale-105 z-10'
                      : markedForReview.has(i)
                      ? 'border-amber-400 bg-amber-400 text-white'
                      : answers[i]
                      ? 'border-[#3B5CFF] bg-blue-50 text-[#3B5CFF]'
                      : 'border-slate-100 bg-[#F9FAFB] text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
                <span className="text-sm font-bold text-slate-900">{Object.keys(answers).length}/{questions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marked</span>
                <span className="text-sm font-bold text-amber-500">{markedForReview.size}</span>
              </div>
              <div className="h-[1px] bg-slate-100" />
              <div className="pt-2">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-[#3B5CFF] h-full transition-all duration-500" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const totalAcc = questions.length > 0 ? Math.round((scoreCounts.correct / questions.length) * 100) : 0;

    return (
      <div className="min-h-screen bg-[#F9FAFB] py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[#3B5CFF] rounded-[2.5rem] p-10 lg:p-12 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Simulation Result</h1>
              <div className="flex items-center gap-3 text-[10px] font-black tracking-widest opacity-80">
                <span className="px-3 py-1 bg-white/20 rounded-full">{topic.toUpperCase()}</span>
                <span className="px-3 py-1 bg-white/20 rounded-full">{examType} PROTOCOL</span>
              </div>
            </div>
            <div className="relative z-10 text-center">
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-2">Aggregate Score</p>
              <div className="text-7xl font-bold text-white">{marks}</div>
            </div>
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-400 rounded-full blur-3xl opacity-40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Correct', value: scoreCounts.correct, color: 'emerald' },
              { label: 'Incorrect', value: scoreCounts.wrong, color: 'rose' },
              { label: 'Accuracy', value: `${totalAcc}%`, color: 'blue' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{stat.label}</p>
                <p className={`text-3xl font-bold text-${stat.color === 'rose' ? 'rose' : (stat.color === 'emerald' ? 'emerald' : 'blue')}-600`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight px-1">Performance Analysis</h3>
            <div className="grid grid-cols-1 gap-4">
              {questions.map((q, i) => {
                const studentAns = answers[i] || 'None';
                const isCorrect = studentAns === q.correct;
                return (
                  <div key={i} className={`bg-white p-8 rounded-xl border transition-all duration-200 shadow-sm relative overflow-hidden ${
                    isCorrect ? 'border-emerald-100 hover:border-emerald-200' : 'border-rose-100 hover:border-rose-200'
                  }`}>
                    <div className="flex gap-6 items-start relative z-10">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm ${
                        isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="space-y-6 flex-1">
                        <h4 className="text-[17px] font-bold text-slate-900 leading-tight">{q.question}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                            <p className={`font-bold text-sm ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                              Your Selection: {studentAns}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="font-bold text-sm text-slate-700">Correct Solution: {q.correct}</p>
                          </div>
                        </div>
                        <div className="p-5 bg-[#F9FAFB] rounded-xl text-[13px] text-slate-600 leading-relaxed border-l-2 border-slate-300 font-medium italic">
                          <span className="font-black text-slate-900 uppercase text-[9px] block mb-2 tracking-widest not-italic">AI Logic Breakdown</span>
                          {q.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={() => {
              setScreen('setup');
              setStep('exam');
            }}
            className="w-full py-5 bg-[#3B5CFF] text-white rounded-xl font-bold text-xs tracking-[0.3em] shadow-xl shadow-blue-200 hover:bg-blue-600 transition-all flex items-center justify-center gap-3 group"
          >
            NEW SIMULATION <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-white">
      {screen === 'initializing' && renderInitializing()}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {screen === 'setup' ? (
          <>
            {renderStepIndicator()}
            <div className="mt-8">
              {renderSetup()}
            </div>
          </>
        ) : screen === 'exam' ? (
          renderExam()
        ) : screen === 'results' ? (
          renderResults()
        ) : null}
      </div>
    </main>
  );
}

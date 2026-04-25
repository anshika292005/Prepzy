import { create } from 'zustand';

export interface Question {
  id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

interface QuizState {
  currentTopic: string;
  currentExamType: 'JEE' | 'UPSC' | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  sessionStartTime: number | null;
  skillScores: Record<string, number>;
  
  setTopic: (topic: string) => void;
  setExamType: (type: 'JEE' | 'UPSC') => void;
  setQuestions: (questions: Question[]) => void;
  answerQuestion: (questionId: string, option: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  startSession: () => void;
  resetSession: () => void;
  updateSkillScore: (topic: string, score: number) => void;
}

export const useQuizStore = create<QuizState>((set: any) => ({
  currentTopic: '',
  currentExamType: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  sessionStartTime: null,
  skillScores: {},

  setTopic: (topic) => set({ currentTopic: topic }),
  
  setExamType: (type) => set({ currentExamType: type }),
  
  setQuestions: (questions) => set({ questions }),
  
  answerQuestion: (questionId, option) => 
    set((state: QuizState) => ({ answers: { ...state.answers, [questionId]: option }})),
    
  nextQuestion: () => 
    set((state: QuizState) => ({ 
      currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1) 
    })),
    
  prevQuestion: () => 
    set((state: QuizState) => ({ currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0) })),
    
  startSession: () => set({ sessionStartTime: Date.now() }),
  
  resetSession: () => set({ 
    questions: [], 
    currentQuestionIndex: 0, 
    answers: {}, 
    sessionStartTime: null 
  }),
  
  updateSkillScore: (topic, score) => 
    set((state: QuizState) => ({ skillScores: { ...state.skillScores, [topic]: score } }))
}));

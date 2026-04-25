import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    authId: string;
    userId: string;
  };
}

export interface MCQQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct: string;
  explanation: string;
  difficulty: string;
  topic: string;
  subtopic: string;
  examRelevance: string;
}

export interface WeakTopic {
  topic: string;
  subtopic: string;
  accuracy: number;
  priority: string;
  reason: string;
  studyTip: string;
  estimatedImpact: string;
}

export interface WeakTopicAnalysis {
  weakTopics: WeakTopic[];
  strengths: string[];
  weeklyPlan: {
    Monday: string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;
  };
  motivationalNote: string;
}

'use client';

import React, { useState, useEffect } from 'react';

export interface Question {
  id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  subtopic?: string;
  examRelevance?: string;
}

export interface QuizCardProps {
  question: Question;
  questionNumber: number;
  total: number;
  onAnswer: (selectedOption: string, isCorrect: boolean) => void;
  onNext: () => void;
}

export function QuizCard({ question, questionNumber, total, onAnswer, onNext }: QuizCardProps) {
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOpt(null);
    setShowExplanation(false);
  }, [question.id]);

  const handleOptionClick = (key: string) => {
    if (selectedOpt) return; // Prevent multiple clicks
    
    setSelectedOpt(key);
    const isCorrect = key === question.correct;
    onAnswer(key, isCorrect);
    
    setTimeout(() => {
      setShowExplanation(true);
    }, 400);
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === 'Easy') return 'bg-green-100 text-green-800 border-green-200';
    if (diff === 'Medium') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (diff === 'Hard') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getOptionStyles = (key: string) => {
    const baseStyle = 'w-full text-left p-4 rounded-lg border-2 transition-all duration-200';
    
    if (!selectedOpt) {
      return `${baseStyle} border-gray-200 hover:border-indigo-400 hover:bg-indigo-50`;
    }
    
    // Post-answer states
    if (key === question.correct) {
      return `${baseStyle} border-green-500 bg-green-50`;
    }
    
    if (key === selectedOpt && selectedOpt !== question.correct) {
      return `${baseStyle} border-red-500 bg-red-50`;
    }
    
    return `${baseStyle} border-gray-200 opacity-50`;
  };

  const progressPercentage = (questionNumber / total) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="w-full bg-gray-100 h-2">
        <div 
          className="bg-indigo-600 h-2 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-gray-500 text-sm font-medium">Question {questionNumber} of {total}</span>
          <div className="flex gap-2 items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-800 border-blue-200">
              {question.topic}
            </span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
          {question.question}
        </h2>

        <div className="flex flex-col gap-3">
          {(Object.entries(question.options) as [string, string][]).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleOptionClick(key)}
              disabled={selectedOpt !== null}
              className={getOptionStyles(key)}
            >
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-current font-bold text-sm">
                  {key}
                </span>
                <span className="text-gray-700 font-medium">{value}</span>
              </div>
            </button>
          ))}
        </div>

        {showExplanation && (
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200">
            <h3 className={`text-lg font-bold mb-3 ${selectedOpt === question.correct ? 'text-green-600' : 'text-red-500'}`}>
              {selectedOpt === question.correct ? 'Correct!' : 'Incorrect'}
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              {question.explanation}
            </p>
            {question.examRelevance && (
              <p className="text-sm text-gray-400 italic mb-6">
                Exam relevance: {question.examRelevance}
              </p>
            )}
            <div className="flex justify-end">
              <button
                onClick={onNext}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                Next question &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

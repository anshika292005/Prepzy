/** 
 * MCQ Prompt Generator - Prepzy
 * Updated for Firebase and Topic-Based Generation
 */

export type ExamType = 'JEE' | 'UPSC' | 'BOTH';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface MCQPromptParams {
  content: string;
  topic: string;
  examType: ExamType;
  skillScore: number;
  count?: number;
}

export interface PerformanceData {
  topic: string;
  subtopic: string;
  correct: number;
  total: number;
}

export function buildMCQPrompt(params: MCQPromptParams): string {
  const { content, topic, examType, skillScore, count = 10 } = params;

  let difficultyLabel = 'Hard (advanced application, tricky distractors, exam-style)';
  if (skillScore < 1100) {
    difficultyLabel = 'Easy (basic recall, direct application)';
  } else if (skillScore < 1300) {
    difficultyLabel = 'Medium (multi-step reasoning, conceptual)';
  }

  const contentSource = (content || "").trim() 
    ? `CONTENT TO BASE QUESTIONS ON:\n"""\n${content}\n"""`
    : `CONTENT TO BASE QUESTIONS ON:\nNo specific study material provided. Use your internal knowledge of the official ${examType} syllabus to generate high-quality, syllabus-accurate questions.`;

  const prompt = `You are an expert exam question setter for ${examType} exams in India.
Your task is to generate exactly ${count} multiple-choice questions (MCQs) for the topic "${topic}".

STUDENT CONTEXT:
- Exam Type: ${examType}
- Target Topic: ${topic}
- Student Elo Skill Score: ${skillScore} / 2000
- Targeted Difficulty: ${difficultyLabel}

${contentSource}

RULES:
1. Each question must have exactly ONE correct answer.
2. All four options (A, B, C, D) must be plausible and strongly act as relevant distractors.
3. NEVER use "All of the above" or "None of the above" as an option.
4. If study material was provided above, generate questions solely from that content. If NOT provided, use current official syllabus patterns for ${examType}.
5. The explanation field must be at least 3 sentences long and thoroughly explain why the correct option is right and the others are wrong.
6. Return ONLY a valid JSON array. No markdown blocks, code fences, or additional text.

JSON FORMAT EXPECTED:
[
  {
    "id": 1,
    "question": "What is...?",
    "options": {
      "A": "Option 1",
      "B": "Option 2",
      "C": "Option 3",
      "D": "Option 4"
    },
    "correct": "A",
    "explanation": "Detailed 3 sentence explanation...",
    "difficulty": "Medium",
    "topic": "${topic}",
    "subtopic": "Specific sub-concept",
    "examRelevance": "High"
  }
]`;

  return prompt;
}

export function buildWeakTopicPrompt(performanceData: PerformanceData[]): string {
  const summary = performanceData
    .map(data => `- ${data.topic} (${data.subtopic}): ${data.correct}/${data.total} correct`)
    .join('\n');

  return `You are a personalized study coach analyzing a student's performance data.

STUDENT PERFORMANCE:
${summary}

TASK:
Identify string and weak areas, and generate a structured weekly action plan to address the weakest subtopics.

Provide the response in ONLY valid JSON format. No markdown blocks, code fences, or additional text.

JSON FORMAT EXPECTED:
{
  "weakTopics": [
    {
      "topic": "String",
      "subtopic": "String",
      "accuracy": 45,
      "priority": "high",
      "reason": "String identifying the root misconception...",
      "studyTip": "String advice...",
      "estimatedImpact": "String"
    }
  ],
  "strengths": ["Strength 1", "Strength 2"],
  "weeklyPlan": {
    "Monday": "Detailed study goal...",
    "Tuesday": "Detailed study goal...",
    "Wednesday": "Detailed study goal...",
    "Thursday": "Detailed study goal...",
    "Friday": "Detailed study goal...",
    "Saturday": "Detailed study goal...",
    "Sunday": "Detailed study goal..."
  },
  "motivationalNote": "A short tailored motivational blurb."
}`;
}

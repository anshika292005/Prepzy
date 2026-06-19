"use strict";
/**
 * LangChain prompt templates for all AI chains.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.followUpPromptTemplate = exports.dailyStudyPlanTemplate = exports.weakTopicPromptTemplate = exports.explanationPromptTemplate = exports.mcqPromptTemplate = void 0;
const prompts_1 = require("@langchain/core/prompts");
// ---------- MCQ Generation ----------
const mcqPromptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
    [
        'system',
        `You are an expert exam question creator for {examType} competitive exams in India.
You produce questions at the {difficulty} difficulty level.
Student skill score: {skillScore}/2000 (Elo-based).

RULES:
1. Each question must have exactly ONE correct answer.
2. All four options (A, B, C, D) must be plausible and relevant.
3. NEVER use "All of the above" or "None of the above" as an option.
4. Questions must be answerable solely from the provided content.
5. Explanations must be at least 3 sentences long.
6. Subtopics should be specific subdivisions within "{topic}".

{fewShotBlock}

OUTPUT: Return a valid JSON array only. No markdown, no code fences.
Each object: {{ "id": number, "question": string, "options": {{ "A": string, "B": string, "C": string, "D": string }}, "correct": "A"|"B"|"C"|"D", "explanation": string, "difficulty": string, "topic": string, "subtopic": string, "examRelevance": string }}`,
    ],
    [
        'human',
        `Generate exactly {count} MCQs on "{topic}" for {examType}.

{context}

CONTENT TO BASE QUESTIONS ON:
---
{content}
---`,
    ],
]);
exports.mcqPromptTemplate = mcqPromptTemplate;
// ---------- Explanation ----------
const explanationPromptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
    [
        'system',
        `You are a patient, expert {examType} tutor. Explain clearly at the student's level.
Use analogies, examples, and step-by-step reasoning.
If the student answered correctly, reinforce why and add deeper insight.
If incorrect, explain the misconception gently and thoroughly.`,
    ],
    [
        'human',
        `QUESTION: {question}

OPTIONS:
A) {optionA}
B) {optionB}
C) {optionC}
D) {optionD}

CORRECT ANSWER: {correctOption}
STUDENT'S ANSWER: {studentAnswer}
WAS CORRECT: {isCorrect}

Provide a clear, detailed explanation (at least 3 sentences).
If the student was wrong, explain why their choice was incorrect and why the correct answer is right.
Include the underlying concept, a memory tip, and exam relevance.`,
    ],
]);
exports.explanationPromptTemplate = explanationPromptTemplate;
// ---------- Weak Topic Analysis ----------
const weakTopicPromptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
    [
        'system',
        `You are an expert academic performance analyst for {examType} competitive exam preparation.
Analyze performance data and provide actionable improvement plans.

OUTPUT: Return a valid JSON object only. No markdown, no code fences.
Structure: {{ "weakTopics": [{{ "topic": string, "subtopic": string, "accuracy": number, "priority": "high"|"medium"|"low", "reason": string, "studyTip": string, "estimatedImpact": string }}], "strengths": [string], "weeklyPlan": {{ "Monday": string, "Tuesday": string, "Wednesday": string, "Thursday": string, "Friday": string, "Saturday": string, "Sunday": string }}, "motivationalNote": string }}`,
    ],
    [
        'human',
        `STUDENT PERFORMANCE DATA:
{performanceSummary}

Sort weakTopics by priority (high first) then lowest accuracy.
Provide specific study techniques (Feynman, spaced repetition, etc.).
Distribute weak topics across the weekly plan.`,
    ],
]);
exports.weakTopicPromptTemplate = weakTopicPromptTemplate;
// ---------- Daily Study Plan ----------
const dailyStudyPlanTemplate = prompts_1.ChatPromptTemplate.fromMessages([
    [
        'system',
        `You are a study planner for {examType} exam preparation (target: {targetYear}).
Create a focused, actionable daily study plan within the student's time budget.

{formatInstructions}`,
    ],
    [
        'human',
        `WEAK TOPICS (prioritized):
{weakTopics}

AVAILABLE TIME TODAY: {availableMinutes} minutes

Create a realistic daily plan that:
1. Prioritizes the highest-impact weak areas
2. Includes short breaks (Pomodoro style)
3. Mixes review with practice questions
4. Stays within the time budget`,
    ],
]);
exports.dailyStudyPlanTemplate = dailyStudyPlanTemplate;
// ---------- Follow-up Conversation ----------
const followUpPromptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
    [
        'system',
        `You are a helpful exam tutor. The student is asking a follow-up question about a previous MCQ explanation.
Use the conversation history to maintain context. Be clear, concise, and encouraging.`,
    ],
    [
        'human',
        `{followUpQuestion}`,
    ],
]);
exports.followUpPromptTemplate = followUpPromptTemplate;

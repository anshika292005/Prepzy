// @ts-nocheck
import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { fetchWeakTopicsTool } from './tools';
import { runWeakTopicChain, runStudyPlanChain } from '../langchain/chains';
import { StudyPlan } from '../langchain/parsers';

interface WeakTopicEntry {
  topic: string;
  subtopic: string;
  accuracy: number;
  skillScore: number;
  totalQuestions: number;
}

export const StudyPlanAnnotation = Annotation.Root({
  userId: Annotation<string>(),
  examType: Annotation<string>(),
  targetYear: Annotation<number>(),
  availableMinutes: Annotation<number>(),
  weakTopics: Annotation<WeakTopicEntry[]>(),
  performanceSummary: Annotation<string>(),
  plan: Annotation<StudyPlan | null>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  error: Annotation<string | null>(),
});

export type StudyPlanAgentState = typeof StudyPlanAnnotation.State;

export interface StudyPlanAgentInput {
  userId: string;
  examType: string;
  targetYear: number;
  availableMinutes: number;
}

// ---------- Node Functions ----------

const fetchPerformanceNode = async (state: StudyPlanAgentState): Promise<Partial<StudyPlanAgentState>> => {
  try {
    const dataStr = await fetchWeakTopicsTool.invoke({ userId: state.userId, topN: 5 });
    const weakTopics = JSON.parse(dataStr) as WeakTopicEntry[];
    return { weakTopics };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: 'Unknown error in fetchPerformanceNode' };
  }
};

const analyzeNode = async (state: StudyPlanAgentState): Promise<Partial<StudyPlanAgentState>> => {
  try {
    const summary = (state.weakTopics || [])
      .map(t => `- ${t.topic} > ${t.subtopic}: ${t.accuracy}% accuracy (${t.totalQuestions} questions, Elo ${t.skillScore})`)
      .join('\n');
    
    await runWeakTopicChain({
      performanceSummary: summary,
      examType: state.examType,
    });
    return { performanceSummary: summary };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: 'Unknown error in analyzeNode' };
  }
};

const planBuilderNode = async (state: StudyPlanAgentState): Promise<Partial<StudyPlanAgentState>> => {
  try {
    const plan = await runStudyPlanChain({
      weakTopics: state.performanceSummary || '',
      availableMinutes: state.availableMinutes,
      examType: state.examType,
      targetYear: state.targetYear,
    });
    return { plan };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: 'Unknown error in planBuilderNode' };
  }
};

const formatterNode = async (state: StudyPlanAgentState): Promise<Partial<StudyPlanAgentState>> => {
  return {};
};

const errorHandlerNode = async (state: StudyPlanAgentState): Promise<Partial<StudyPlanAgentState>> => {
  console.error('Study Plan Agent Error:', state.error);
  return { plan: null };
};

// ---------- Edges logic ----------

const routeAfterFetch = (state: StudyPlanAgentState) => state.error ? 'errorHandlerNode' : 'analyzeNode';
const routeAfterAnalyze = (state: StudyPlanAgentState) => state.error ? 'errorHandlerNode' : 'planBuilderNode';
const routeAfterPlan = (state: StudyPlanAgentState) => state.error ? 'errorHandlerNode' : 'formatterNode';

// ---------- Graph Definition ----------

const studyPlanAgentGraph = new StateGraph(StudyPlanAnnotation)
  .addNode('fetchPerformanceNode', fetchPerformanceNode)
  .addNode('analyzeNode', analyzeNode)
  .addNode('planBuilderNode', planBuilderNode)
  .addNode('formatterNode', formatterNode)
  .addNode('errorHandlerNode', errorHandlerNode)
  
  .addEdge(START, 'fetchPerformanceNode')
  .addConditionalEdges('fetchPerformanceNode', routeAfterFetch)
  .addConditionalEdges('analyzeNode', routeAfterAnalyze)
  .addConditionalEdges('planBuilderNode', routeAfterPlan)
  .addEdge('formatterNode', END)
  .addEdge('errorHandlerNode', END);

const studyPlanAgent = studyPlanAgentGraph.compile();

export const runStudyPlanAgent = async (input: StudyPlanAgentInput): Promise<StudyPlan> => {
  const result = await studyPlanAgent.invoke({
    userId: input.userId,
    examType: input.examType,
    targetYear: input.targetYear,
    availableMinutes: input.availableMinutes,
  });

  if (!result.plan) {
    throw new Error(result.error || 'Failed to generate study plan');
  }
  
  return result.plan;
};

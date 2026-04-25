// @ts-nocheck
import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { MCQQuestion } from '../../types/index';
import { fetchSkillScoreTool, retrieveNotesTool, generateMCQsTool, saveSessionTool } from './tools';

export const ExamAgentAnnotation = Annotation.Root({
  userId: Annotation<string>(),
  examType: Annotation<string>(),
  topic: Annotation<string>(),
  count: Annotation<number>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  mcqs: Annotation<MCQQuestion[]>(),
  currentScore: Annotation<number>(),
  sessionId: Annotation<string>(),
  error: Annotation<string | null>(),
  ragContext: Annotation<string>(),
});

export type ExamAgentState = typeof ExamAgentAnnotation.State;

export interface ExamAgentInput {
  userId: string;
  topic: string;
  examType: string;
  count: number;
}

export interface ExamAgentOutput {
  mcqs: MCQQuestion[];
  sessionId: string;
  skillScore: number;
}

// ---------- Node Functions ----------

const plannerNode = async (state: ExamAgentState): Promise<Partial<ExamAgentState>> => {
  try {
    const scoreStr = await fetchSkillScoreTool.invoke({ userId: state.userId, topic: state.topic });
    return { currentScore: parseInt(scoreStr, 10) };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: 'Unknown error in plannerNode' };
  }
};

const ragNode = async (state: ExamAgentState): Promise<Partial<ExamAgentState>> => {
  try {
    const context = await retrieveNotesTool.invoke({ userId: state.userId, topic: state.topic, query: state.topic });
    return { ragContext: context };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: 'Unknown error in ragNode' };
  }
};

const mcqGeneratorNode = async (state: ExamAgentState): Promise<Partial<ExamAgentState>> => {
  try {
    const rawContent = state.ragContext !== 'No notes found.' && state.ragContext !== ''
      ? state.ragContext
      : 'General knowledge about ' + state.topic;

    const questionsStr = await generateMCQsTool.invoke({
      content: rawContent,
      topic: state.topic,
      examType: state.examType,
      skillScore: state.currentScore || 1200,
      count: state.count || 5,
    });
    const parsed = JSON.parse(questionsStr) as MCQQuestion[];
    return { mcqs: parsed };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: 'Unknown error in mcqGeneratorNode' };
  }
};

const sessionSaverNode = async (state: ExamAgentState): Promise<Partial<ExamAgentState>> => {
  try {
    const sessionId = await saveSessionTool.invoke({
      userId: state.userId,
      topic: state.topic,
      examType: state.examType,
      totalQuestions: state.count || 5,
      correctCount: 0,
      durationSeconds: 0,
    });
    return { sessionId };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return { error: 'Unknown error in sessionSaverNode' };
  }
};

const errorHandlerNode = async (state: ExamAgentState): Promise<Partial<ExamAgentState>> => {
  console.error('Agent Error:', state.error);
  return { mcqs: [], sessionId: 'error_occurred' };
};

// ---------- Edges logic ----------

const routeAfterPlanner = (state: ExamAgentState): 'ragNode' | 'errorHandlerNode' => {
  if (state.error) return 'errorHandlerNode';
  return 'ragNode';
};

const routeAfterRag = (state: ExamAgentState): 'mcqGeneratorNode' | 'errorHandlerNode' => {
  if (state.error) return 'errorHandlerNode';
  return 'mcqGeneratorNode';
};

const routeAfterMcq = (state: ExamAgentState): 'sessionSaverNode' | 'errorHandlerNode' => {
  if (state.error) return 'errorHandlerNode';
  return 'sessionSaverNode';
};

// ---------- Graph Definition ----------

const examAgentGraph = new StateGraph(ExamAgentAnnotation)
  .addNode('plannerNode', plannerNode)
  .addNode('ragNode', ragNode)
  .addNode('mcqGeneratorNode', mcqGeneratorNode)
  .addNode('sessionSaverNode', sessionSaverNode)
  .addNode('errorHandlerNode', errorHandlerNode)
  
  .addEdge(START, 'plannerNode')
  .addConditionalEdges('plannerNode', routeAfterPlanner)
  .addConditionalEdges('ragNode', routeAfterRag)
  .addConditionalEdges('mcqGeneratorNode', routeAfterMcq)
  .addEdge('sessionSaverNode', END)
  .addEdge('errorHandlerNode', END);

const examAgent = examAgentGraph.compile();

export const runExamAgent = async (input: ExamAgentInput): Promise<ExamAgentOutput> => {
  const result = await examAgent.invoke({
    userId: input.userId,
    topic: input.topic,
    examType: input.examType,
    count: input.count,
  });

  return {
    mcqs: result.mcqs,
    sessionId: result.sessionId,
    skillScore: result.currentScore,
  };
};

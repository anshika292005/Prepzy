"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExamAgent = exports.ExamAgentAnnotation = void 0;
// @ts-nocheck
const langgraph_1 = require("@langchain/langgraph");
const tools_1 = require("./tools");
exports.ExamAgentAnnotation = langgraph_1.Annotation.Root({
    userId: (0, langgraph_1.Annotation)(),
    examType: (0, langgraph_1.Annotation)(),
    topic: (0, langgraph_1.Annotation)(),
    count: (0, langgraph_1.Annotation)(),
    messages: (0, langgraph_1.Annotation)({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    mcqs: (0, langgraph_1.Annotation)(),
    currentScore: (0, langgraph_1.Annotation)(),
    sessionId: (0, langgraph_1.Annotation)(),
    error: (0, langgraph_1.Annotation)(),
    ragContext: (0, langgraph_1.Annotation)(),
});
// ---------- Node Functions ----------
const plannerNode = async (state) => {
    try {
        const scoreStr = await tools_1.fetchSkillScoreTool.invoke({ userId: state.userId, topic: state.topic });
        return { currentScore: parseInt(scoreStr, 10) };
    }
    catch (err) {
        if (err instanceof Error)
            return { error: err.message };
        return { error: 'Unknown error in plannerNode' };
    }
};
const ragNode = async (state) => {
    try {
        const context = await tools_1.retrieveNotesTool.invoke({ userId: state.userId, topic: state.topic, query: state.topic });
        return { ragContext: context };
    }
    catch (err) {
        if (err instanceof Error)
            return { error: err.message };
        return { error: 'Unknown error in ragNode' };
    }
};
const mcqGeneratorNode = async (state) => {
    try {
        const rawContent = state.ragContext !== 'No notes found.' && state.ragContext !== ''
            ? state.ragContext
            : 'General knowledge about ' + state.topic;
        const questionsStr = await tools_1.generateMCQsTool.invoke({
            content: rawContent,
            topic: state.topic,
            examType: state.examType,
            skillScore: state.currentScore || 1200,
            count: state.count || 5,
        });
        const parsed = JSON.parse(questionsStr);
        return { mcqs: parsed };
    }
    catch (err) {
        if (err instanceof Error)
            return { error: err.message };
        return { error: 'Unknown error in mcqGeneratorNode' };
    }
};
const sessionSaverNode = async (state) => {
    try {
        const sessionId = await tools_1.saveSessionTool.invoke({
            userId: state.userId,
            topic: state.topic,
            examType: state.examType,
            totalQuestions: state.count || 5,
            correctCount: 0,
            durationSeconds: 0,
        });
        return { sessionId };
    }
    catch (err) {
        if (err instanceof Error)
            return { error: err.message };
        return { error: 'Unknown error in sessionSaverNode' };
    }
};
const errorHandlerNode = async (state) => {
    console.error('Agent Error:', state.error);
    return { mcqs: [], sessionId: 'error_occurred' };
};
// ---------- Edges logic ----------
const routeAfterPlanner = (state) => {
    if (state.error)
        return 'errorHandlerNode';
    return 'ragNode';
};
const routeAfterRag = (state) => {
    if (state.error)
        return 'errorHandlerNode';
    return 'mcqGeneratorNode';
};
const routeAfterMcq = (state) => {
    if (state.error)
        return 'errorHandlerNode';
    return 'sessionSaverNode';
};
// ---------- Graph Definition ----------
const examAgentGraph = new langgraph_1.StateGraph(exports.ExamAgentAnnotation)
    .addNode('plannerNode', plannerNode)
    .addNode('ragNode', ragNode)
    .addNode('mcqGeneratorNode', mcqGeneratorNode)
    .addNode('sessionSaverNode', sessionSaverNode)
    .addNode('errorHandlerNode', errorHandlerNode)
    .addEdge(langgraph_1.START, 'plannerNode')
    .addConditionalEdges('plannerNode', routeAfterPlanner)
    .addConditionalEdges('ragNode', routeAfterRag)
    .addConditionalEdges('mcqGeneratorNode', routeAfterMcq)
    .addEdge('sessionSaverNode', langgraph_1.END)
    .addEdge('errorHandlerNode', langgraph_1.END);
const examAgent = examAgentGraph.compile();
const runExamAgent = async (input) => {
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
exports.runExamAgent = runExamAgent;

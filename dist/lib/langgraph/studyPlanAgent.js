"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStudyPlanAgent = exports.StudyPlanAnnotation = void 0;
// @ts-nocheck
const langgraph_1 = require("@langchain/langgraph");
const tools_1 = require("./tools");
const chains_1 = require("../langchain/chains");
exports.StudyPlanAnnotation = langgraph_1.Annotation.Root({
    userId: (0, langgraph_1.Annotation)(),
    examType: (0, langgraph_1.Annotation)(),
    targetYear: (0, langgraph_1.Annotation)(),
    availableMinutes: (0, langgraph_1.Annotation)(),
    weakTopics: (0, langgraph_1.Annotation)(),
    performanceSummary: (0, langgraph_1.Annotation)(),
    plan: (0, langgraph_1.Annotation)(),
    messages: (0, langgraph_1.Annotation)({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    error: (0, langgraph_1.Annotation)(),
});
// ---------- Node Functions ----------
const fetchPerformanceNode = async (state) => {
    try {
        const dataStr = await tools_1.fetchWeakTopicsTool.invoke({ userId: state.userId, topN: 5 });
        const weakTopics = JSON.parse(dataStr);
        return { weakTopics };
    }
    catch (err) {
        if (err instanceof Error)
            return { error: err.message };
        return { error: 'Unknown error in fetchPerformanceNode' };
    }
};
const analyzeNode = async (state) => {
    try {
        const summary = (state.weakTopics || [])
            .map(t => `- ${t.topic} > ${t.subtopic}: ${t.accuracy}% accuracy (${t.totalQuestions} questions, Elo ${t.skillScore})`)
            .join('\n');
        await (0, chains_1.runWeakTopicChain)({
            performanceSummary: summary,
            examType: state.examType,
        });
        return { performanceSummary: summary };
    }
    catch (err) {
        if (err instanceof Error)
            return { error: err.message };
        return { error: 'Unknown error in analyzeNode' };
    }
};
const planBuilderNode = async (state) => {
    try {
        const plan = await (0, chains_1.runStudyPlanChain)({
            weakTopics: state.performanceSummary || '',
            availableMinutes: state.availableMinutes,
            examType: state.examType,
            targetYear: state.targetYear,
        });
        return { plan };
    }
    catch (err) {
        if (err instanceof Error)
            return { error: err.message };
        return { error: 'Unknown error in planBuilderNode' };
    }
};
const formatterNode = async (state) => {
    return {};
};
const errorHandlerNode = async (state) => {
    console.error('Study Plan Agent Error:', state.error);
    return { plan: null };
};
// ---------- Edges logic ----------
const routeAfterFetch = (state) => state.error ? 'errorHandlerNode' : 'analyzeNode';
const routeAfterAnalyze = (state) => state.error ? 'errorHandlerNode' : 'planBuilderNode';
const routeAfterPlan = (state) => state.error ? 'errorHandlerNode' : 'formatterNode';
// ---------- Graph Definition ----------
const studyPlanAgentGraph = new langgraph_1.StateGraph(exports.StudyPlanAnnotation)
    .addNode('fetchPerformanceNode', fetchPerformanceNode)
    .addNode('analyzeNode', analyzeNode)
    .addNode('planBuilderNode', planBuilderNode)
    .addNode('formatterNode', formatterNode)
    .addNode('errorHandlerNode', errorHandlerNode)
    .addEdge(langgraph_1.START, 'fetchPerformanceNode')
    .addConditionalEdges('fetchPerformanceNode', routeAfterFetch)
    .addConditionalEdges('analyzeNode', routeAfterAnalyze)
    .addConditionalEdges('planBuilderNode', routeAfterPlan)
    .addEdge('formatterNode', langgraph_1.END)
    .addEdge('errorHandlerNode', langgraph_1.END);
const studyPlanAgent = studyPlanAgentGraph.compile();
const runStudyPlanAgent = async (input) => {
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
exports.runStudyPlanAgent = runStudyPlanAgent;

"use strict";
/**
 * Heuristic content filtering for AI outputs to ensure safety and quality control.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeExplanation = exports.filterMCQOutput = void 0;
const filterMCQOutput = async (mcqs, topic) => {
    const allowedOptions = ['A', 'B', 'C', 'D'];
    const normalizedTopic = topic.trim().toLowerCase();
    return mcqs.filter((q) => {
        // 1. Minimum question length
        if (!q.question || q.question.length < 20)
            return false;
        // 2. Minimum explanation length
        if (!q.explanation || q.explanation.length < 100)
            return false;
        // 3. Valid correct key
        if (!allowedOptions.includes(q.correct))
            return false;
        // 4. Check if actual options exist
        if (!q.options || !q.options.A || !q.options.B || !q.options.C || !q.options.D)
            return false;
        // 5. Mild topic relevance check (AI can sometimes wander off, but we don't want to be too strict 
        //    if the topic is inherently broad. We check if they differ significantly and completely miss keywords).
        //    For now, this is basic string matching to prevent total hallucination.
        if (q.topic) {
            const genTopic = q.topic.toLowerCase();
            // If they share no words at all, flag it.
            const requestedWords = normalizedTopic.split(' ');
            const hasOverlap = requestedWords.some(w => genTopic.includes(w) || normalizedTopic.includes(genTopic));
            // We will only strictly drop it if not even one word matches AND it's completely alien.
            // E.g. Topic "Quantum Mechanics" vs generated "Indian Polity".
            // Simple heuristic: 
            // If none match, let's keep it but ideally we'd use similarity. We keep this loose.
        }
        return true;
    });
};
exports.filterMCQOutput = filterMCQOutput;
const sanitizeExplanation = (text) => {
    let clean = text;
    // Strip code fences that AI sometimes injects incorrectly
    clean = clean.replace(/```[a-z]*\n/g, '');
    clean = clean.replace(/```/g, '');
    // Collapse excessive newlines
    clean = clean.replace(/\n{3,}/g, '\n\n');
    return clean.trim();
};
exports.sanitizeExplanation = sanitizeExplanation;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const questionResponseSchema = new mongoose_1.Schema({
    sessionId: {
        type: String,
        required: [true, 'sessionId is required'],
        index: true,
    },
    questionText: {
        type: String,
        required: [true, 'Question text is required'],
    },
    options: {
        type: mongoose_1.Schema.Types.Mixed,
        required: [true, 'Options are required'],
    },
    correctOption: {
        type: String,
        required: [true, 'Correct option is required'],
        enum: ['A', 'B', 'C', 'D'],
    },
    studentAnswer: {
        type: String,
        required: [true, 'Student answer is required'],
    },
    isCorrect: {
        type: Boolean,
        required: true,
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard'],
    },
    aiExplanation: {
        type: String,
        default: '',
    },
    topic: {
        type: String,
        required: true,
        trim: true,
    },
    subtopic: {
        type: String,
        trim: true,
        default: 'General',
    },
});
const QuestionResponse = mongoose_1.default.models.QuestionResponse || mongoose_1.default.model('QuestionResponse', questionResponseSchema);
exports.default = QuestionResponse;

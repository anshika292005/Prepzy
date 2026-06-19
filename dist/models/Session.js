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
const sessionSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: [true, 'userId is required'],
        index: true,
    },
    topic: {
        type: String,
        required: [true, 'Topic is required'],
        trim: true,
    },
    examType: {
        type: String,
        required: [true, 'Exam type is required'],
        enum: {
            values: ['JEE', 'UPSC', 'BOTH'],
            message: 'Exam type must be JEE, UPSC, or BOTH',
        },
    },
    totalQuestions: {
        type: Number,
        required: true,
        min: [1, 'Must have at least 1 question'],
    },
    correctCount: {
        type: Number,
        required: true,
        min: 0,
    },
    durationSeconds: {
        type: Number,
        required: true,
        min: 0,
    },
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
});
const Session = mongoose_1.default.models.Session || mongoose_1.default.model('Session', sessionSchema);
exports.default = Session;

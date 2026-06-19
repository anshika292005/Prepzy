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
const userProfileSchema = new mongoose_1.Schema({
    authId: {
        type: String,
        required: [true, 'authId is required'],
        unique: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    examType: {
        type: String,
        required: [true, 'Exam type is required'],
        enum: {
            values: ['JEE', 'UPSC', 'BOTH'],
            message: 'Exam type must be JEE, UPSC, or BOTH',
        },
    },
    targetYear: {
        type: Number,
        required: [true, 'Target year is required'],
        min: [2024, 'Target year must be 2024 or later'],
        max: [2030, 'Target year cannot exceed 2030'],
    },
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
});
const UserProfile = mongoose_1.default.models.UserProfile || mongoose_1.default.model('UserProfile', userProfileSchema);
exports.default = UserProfile;

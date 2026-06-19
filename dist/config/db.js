"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectDB = async () => {
    if (mongoose_1.default.connection.readyState >= 1) {
        return;
    }
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
        throw new Error('MONGO_URI environment variable is not set.');
    }
    try {
        const conn = await mongoose_1.default.connect(mongoURI);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`❌ MongoDB connection error: ${error.message}`);
        }
    }
};
exports.default = connectDB;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserProfile_1 = __importDefault(require("../models/UserProfile"));
const apiResponse_1 = require("../utils/apiResponse");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            (0, apiResponse_1.sendError)(res, 'Authentication required. No token provided.', 401);
            return;
        }
        const token = authHeader.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            (0, apiResponse_1.sendError)(res, 'Server configuration error.', 500);
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const profile = await UserProfile_1.default.findOne({ authId: decoded.authId });
        if (!profile) {
            (0, apiResponse_1.sendError)(res, 'User not found.', 401);
            return;
        }
        req.user = {
            authId: decoded.authId,
            userId: profile._id.toString(),
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            (0, apiResponse_1.sendError)(res, 'Invalid or expired token.', 401);
            return;
        }
        next(error);
    }
};
exports.default = authMiddleware;

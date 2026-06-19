"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, statusCode = 200) => {
    const body = { success: true, data };
    return res.status(statusCode).json(body);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 500) => {
    const body = { success: false, message };
    return res.status(statusCode).json(body);
};
exports.sendError = sendError;

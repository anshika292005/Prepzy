"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const errorMiddleware = (err, _req, res, _next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    // Mongoose ValidationError — 400 with field-level messages
    if (err instanceof mongoose_1.Error.ValidationError) {
        statusCode = 400;
        const fieldMessages = Object.values(err.errors).map((fieldError) => fieldError.message);
        message = fieldMessages.join('; ');
    }
    // Mongoose CastError — bad ObjectId
    else if (err instanceof mongoose_1.Error.CastError) {
        statusCode = 400;
        message = 'Invalid ID format';
    }
    // MongoDB duplicate key error (code 11000)
    else if (err.code === 11000) {
        statusCode = 409;
        message = 'Already exists';
    }
    // Use the error's own message if nothing specific matched
    else if (err.message) {
        message = err.message;
    }
    const body = {
        success: false,
        message,
    };
    if (process.env.NODE_ENV === 'development') {
        body.stack = err.stack;
    }
    res.status(statusCode).json(body);
};
exports.default = errorMiddleware;

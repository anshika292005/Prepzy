import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { Error as MongooseError } from 'mongoose';

interface MongoServerError extends Error {
  code: number;
  keyPattern?: Record<string, number>;
}

interface ErrorBody {
  success: false;
  message: string;
  stack?: string;
}

const errorMiddleware: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Mongoose ValidationError — 400 with field-level messages
  if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    const fieldMessages = Object.values(err.errors).map(
      (fieldError) => fieldError.message
    );
    message = fieldMessages.join('; ');
  }

  // Mongoose CastError — bad ObjectId
  else if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // MongoDB duplicate key error (code 11000)
  else if ((err as MongoServerError).code === 11000) {
    statusCode = 409;
    message = 'Already exists';
  }

  // Use the error's own message if nothing specific matched
  else if (err.message) {
    message = err.message;
  }

  const body: ErrorBody = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

export default errorMiddleware;

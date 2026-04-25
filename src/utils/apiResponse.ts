import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  message: string;
}

const sendSuccess = <T>(res: Response, data: T, statusCode: number = 200): Response => {
  const body: SuccessResponse<T> = { success: true, data };
  return res.status(statusCode).json(body);
};

const sendError = (res: Response, message: string, statusCode: number = 500): Response => {
  const body: ErrorResponse = { success: false, message };
  return res.status(statusCode).json(body);
};

export { sendSuccess, sendError };

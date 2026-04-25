import { Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import UserProfile from '../models/UserProfile';
import { AuthRequest } from '../types/index';
import { sendError } from '../utils/apiResponse';

interface JwtPayload {
  authId: string;
  iat?: number;
  exp?: number;
}

const authMiddleware: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication required. No token provided.', 401);
      return;
    }

    const token = authHeader.split(' ')[1];

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      sendError(res, 'Server configuration error.', 500);
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    const profile = await UserProfile.findOne({ authId: decoded.authId });

    if (!profile) {
      sendError(res, 'User not found.', 401);
      return;
    }

    req.user = {
      authId: decoded.authId,
      userId: profile._id.toString(),
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      sendError(res, 'Invalid or expired token.', 401);
      return;
    }
    next(error);
  }
};

export default authMiddleware;

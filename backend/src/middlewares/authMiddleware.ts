import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/customError';
import { UserPayload } from '../services/authService';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_access_secret';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new CustomError('Access token is missing or malformed', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new CustomError('Access token has expired', 401));
    }
    return next(new CustomError('Access token is invalid', 401));
  }
};

export const requireRole = (roles: Array<'ADMIN' | 'EMPLOYEE'>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new CustomError('Forbidden: Access denied', 403));
    }

    next();
  };
};

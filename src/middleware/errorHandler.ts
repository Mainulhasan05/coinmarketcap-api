// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
}

// Handle 404 errors
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error: ErrorWithStatus = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Handle all other errors
export const errorHandler = (err: ErrorWithStatus, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.status || 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};
/**
 * Error Middleware
 * 
 * Global error handling middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let stack: string | undefined;
  
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  
  if (process.env.NODE_ENV === 'development') {
    stack = error.stack;
  }
  
  const errorResponse: Record<string, any> = {
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
  };
  
  if (stack) {
    errorResponse.stack = stack;
  }
  
  if (error instanceof AppError && 'details' in error) {
    errorResponse.details = (error as any).details;
  }
  
  res.status(statusCode).json(errorResponse);
};

export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/v1/health',
      'GET /api/v1/health/ready',
      'GET /api/v1/health/live',
      'GET /api/v1/info',
      'GET /api/v1/info/endpoints',
      'GET /api/v1/info/versions',
    ],
  });
};

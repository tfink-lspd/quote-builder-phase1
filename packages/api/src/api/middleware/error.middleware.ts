import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { ApiErrorResponse } from '@lightspeed/quote-builder-shared/types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle known application errors
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unknown errors
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  };

  res.status(500).json(response);
}

// Common error creators
export const errors = {
  notFound: (resource: string) =>
    new AppError(404, 'NOT_FOUND', `${resource} not found`),

  validation: (message: string, details?: any) =>
    new AppError(400, 'VALIDATION_ERROR', message, details),

  unauthorized: (message = 'Unauthorized') =>
    new AppError(401, 'UNAUTHORIZED', message),

  forbidden: (message = 'Forbidden') =>
    new AppError(403, 'FORBIDDEN', message),

  conflict: (message: string) =>
    new AppError(409, 'CONFLICT', message),

  internal: (message = 'Internal server error') =>
    new AppError(500, 'INTERNAL_ERROR', message)
};

import type { NextFunction, Request, Response } from 'express';

interface HttpError {
  message: string;
  statusCode?: number;
}

function isMongoDuplicate(err: unknown): err is { code: number } {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

function isMongooseValidationError(err: unknown): err is { errors: Record<string, { message: string }> } {
  return typeof err === 'object' && err !== null && (err as { name?: string }).name === 'ValidationError';
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: HttpError = {
    message: err instanceof Error ? err.message : 'Server Error',
  };

  console.error(err);

  if (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'CastError') {
    error = { message: 'Resource not found', statusCode: 404 };
  }

  if (isMongoDuplicate(err)) {
    error = { message: 'Duplicate field value entered', statusCode: 400 };
  }

  if (isMongooseValidationError(err)) {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = { message, statusCode: 400 };
  }

  if (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'JsonWebTokenError') {
    error = { message: 'Invalid token', statusCode: 401 };
  }

  if (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'TokenExpiredError') {
    error = { message: 'Token expired', statusCode: 401 };
  }

  const stack = err instanceof Error ? err.stack : undefined;

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && stack && { stack }),
  });
};

export default errorHandler;

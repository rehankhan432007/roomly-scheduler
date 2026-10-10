import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { ApiError, errorResponse } from '@meetmaze/shared/core';
import { logger } from './logger.js';

export function validate(schemas: {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'issues' in err) {
        next(new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', (err as { issues: unknown }).issues));
      } else {
        next(err);
      }
    }
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json(errorResponse(err.code, err.message, err.details));
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json(errorResponse('INTERNAL', 'Internal server error'));
}

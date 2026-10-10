import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import { ApiError } from '@meetmaze/shared/core';
import { config } from './config.js';

// ---- Validation middleware ----
export function validate(schemas: { body?: ZodSchema; query?: ZodSchema; params?: ZodSchema }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as any;
      if (schemas.params) req.params = schemas.params.parse(req.params) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ApiError(400, 'VALIDATION_ERROR', 'Invalid input', err.errors));
      } else {
        next(err);
      }
    }
  };
}

// ---- Auth types ----
export interface AuthUser {
  sub: string;
  role: 'CLIENT' | 'OWNER';
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const cookie = req.cookies?.[config.cookieName];
  if (cookie) return cookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = payload;
  } catch { /* ignore invalid tokens */ }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required'));
  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = payload;
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token'));
  }
}

export function requireRole(...roles: ('CLIENT' | 'OWNER')[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required'));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'FORBIDDEN', 'Insufficient permissions'));
    next();
  };
}

// ---- Error handler ----
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL', message: 'An unexpected error occurred' },
  });
}

// ---- Success helpers ----
export function ok<T>(res: Response, data: T, meta?: { page?: number; pageSize?: number; total?: number }, status = 200) {
  res.status(status).json({ success: true, data, meta });
}

export function created<T>(res: Response, data: T) {
  ok(res, data, undefined, 201);
}

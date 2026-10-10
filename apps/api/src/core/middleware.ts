import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { ApiError } from '@meetmaze/shared/core';

export interface JwtPayload {
  sub: string;
  role: 'CLIENT' | 'OWNER';
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const cookie = req.cookies?.[config.cookieName];
  if (cookie) return cookie;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = payload;
    } catch {
      // Invalid token — continue unauthenticated
    }
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required'));
  }
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token'));
  }
}

export function requireRole(...roles: ('CLIENT' | 'OWNER')[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
}

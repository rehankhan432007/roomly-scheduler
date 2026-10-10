import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '@meetmaze/shared/core';
import { config } from './config.js';

export interface JwtPayload {
  sub: string;
  role: 'CLIENT' | 'OWNER';
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const cookie = req.cookies?.[config.jwt.cookieName];
  if (cookie) return cookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required'));
    return;
  }
  try {
    req.user = jwt.verify(token, config.jwt.secret) as JwtPayload;
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token'));
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      // ignore
    }
  }
  next();
}

export function requireRole(role: 'CLIENT' | 'OWNER') {
  return (req: Request, res: Response, next: NextFunction): void => {
    requireAuth(req, res, (err) => {
      if (err) { next(err); return; }
      if (req.user?.role !== role) {
        next(new ApiError(403, 'FORBIDDEN', `Requires ${role} role`));
        return;
      }
      next();
    });
  };
}

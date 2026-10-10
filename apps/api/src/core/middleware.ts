// Express middleware: auth, validation, rate limiting, async handler
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ZodSchema, ZodError } from 'zod';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { ApiError } from './errors.js';
import { logger } from './logger.js';

// ---- JWT user type ----
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

// ---- Async handler wrapper ----
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// ---- Auth middleware ----
function extractToken(req: Request): string | null {
  // Check cookie first
  const cookieToken = req.cookies?.[config.COOKIE_NAME] as string | undefined;
  if (cookieToken) return cookieToken;

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token');
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required'));
  }
  req.user = verifyToken(token);
  next();
};

export function requireRole(...roles: ('CLIENT' | 'OWNER')[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'You do not have access to this resource'));
    }
    next();
  };
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // Token invalid, continue without user
    }
  }
  next();
};

// ---- Validation middleware ----
export function validate(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Record<string, string>;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', err.flatten().fieldErrors),
        );
      }
      next(err);
    }
  };
}

// ---- Rate limiters ----
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});

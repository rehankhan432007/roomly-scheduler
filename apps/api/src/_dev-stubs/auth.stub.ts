import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError, successResponse, UserRole } from '@meetmaze/shared/core';
import type { Knex } from 'knex';

export function createAuthStubRoutes(db: Knex, config: Record<string, unknown>) {
  const router = Router();

  router.post('/auth/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      // In a real app we'd check bcrypt, here we just check if it's the demo password
      if (password !== 'Demo@1234') {
        throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid credentials');
      }

      const user = await db('users').where({ email }).first();
      if (!user) {
        throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid credentials');
      }

      const token = jwt.sign(
        { sub: user.id, role: user.role, email: user.email, name: user.name },
        (config.jwt as Record<string, string>).secret,
        { expiresIn: (config.jwt as Record<string, string>).expiresIn }
      );

      res.cookie(config.cookieName as string, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json(successResponse({ user: { id: user.id, role: user.role, email: user.email, name: user.name }, token }));
    } catch (err) { next(err); }
  });

  router.get('/auth/me', async (req, res, next) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHENTICATED', 'Not logged in');
      res.json(successResponse({ user: req.user }));
    } catch (err) { next(err); }
  });

  router.post('/auth/logout', async (_req, res, next) => {
    try {
      res.clearCookie(config.cookieName as string);
      res.json(successResponse({ loggedOut: true }));
    } catch (err) { next(err); }
  });

  return router;
}

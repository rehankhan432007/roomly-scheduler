// Auth module — Part 1
import type { ApiModule, ModuleContext } from '@meetmaze/shared/contracts';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { asyncHandler, validate, requireAuth, authRateLimiter } from '../../core/middleware.js';
import { ApiError } from '../../core/errors.js';
import { config } from '../../core/config.js';
import type { JwtPayload } from '../../core/middleware.js';

// ---- Validation schemas ----
const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(190).transform((e) => e.toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((p) => /[a-zA-Z]/.test(p), 'Password must contain at least one letter')
    .refine((p) => /[0-9]/.test(p), 'Password must contain at least one digit'),
  role: z.enum(['CLIENT', 'OWNER']),
  company: z.string().max(160).optional(),
  phone: z.string().max(32).optional(),
});

const loginSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase()),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  company: z.string().max(160).nullable().optional(),
  phone: z.string().max(32).nullable().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .refine((p) => /[a-zA-Z]/.test(p), 'Password must contain at least one letter')
    .refine((p) => /[0-9]/.test(p), 'Password must contain at least one digit'),
});

function signToken(user: { id: string; role: string; email: string; name: string }): string {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, name: user.name } as JwtPayload,
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN },
  );
}

function setCookie(res: import('express').Response, token: string): void {
  res.cookie(config.COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

const authModule: ApiModule = {
  name: 'auth',
  part: 1,
  provides: [],
  requires: [],

  register(ctx: ModuleContext) {
    const { router, db, logger } = ctx;

    // POST /auth/register
    router.post(
      '/auth/register',
      authRateLimiter,
      validate({ body: registerSchema }),
      asyncHandler(async (req, res) => {
        const { name, email, password, role, company, phone } = req.body;

        // Check existing
        const existing = await db('users').where({ email }).first();
        if (existing) {
          throw new ApiError(409, 'CONFLICT', 'An account with this email already exists');
        }

        const id = uuid();
        const passwordHash = await bcrypt.hash(password, 10);

        await db('users').insert({
          id,
          name,
          email,
          password_hash: passwordHash,
          role,
          company: company ?? null,
          phone: phone ?? null,
        });

        const token = signToken({ id, role, email, name });
        setCookie(res, token);

        logger.info(`User registered: ${email} (${role})`);

        res.status(201).json({
          success: true,
          data: {
            user: { id, name, email, role, company: company ?? null, phone: phone ?? null },
            token,
          },
        });
      }),
    );

    // POST /auth/login
    router.post(
      '/auth/login',
      authRateLimiter,
      validate({ body: loginSchema }),
      asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        const user = await db('users').where({ email }).first();
        if (!user) {
          throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid email or password');
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
          throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid email or password');
        }

        const token = signToken({
          id: user.id,
          role: user.role,
          email: user.email,
          name: user.name,
        });
        setCookie(res, token);

        logger.info(`User logged in: ${email}`);

        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              company: user.company,
              phone: user.phone,
            },
            token,
          },
        });
      }),
    );

    // POST /auth/logout
    router.post('/auth/logout', (_req, res) => {
      res.clearCookie(config.COOKIE_NAME, { path: '/' });
      res.json({ success: true, data: { message: 'Logged out' } });
    });

    // GET /auth/me
    router.get(
      '/auth/me',
      requireAuth,
      asyncHandler(async (req, res) => {
        const user = await db('users')
          .where({ id: req.user!.sub })
          .select('id', 'name', 'email', 'role', 'company', 'phone', 'created_at as createdAt')
          .first();

        if (!user) {
          throw new ApiError(404, 'NOT_FOUND', 'User not found');
        }

        res.json({ success: true, data: { user } });
      }),
    );

    // PATCH /users/me
    router.patch(
      '/users/me',
      requireAuth,
      validate({ body: updateProfileSchema }),
      asyncHandler(async (req, res) => {
        const updates: Record<string, unknown> = {};
        if (req.body.name !== undefined) updates.name = req.body.name;
        if (req.body.company !== undefined) updates.company = req.body.company;
        if (req.body.phone !== undefined) updates.phone = req.body.phone;

        if (Object.keys(updates).length === 0) {
          throw new ApiError(400, 'VALIDATION_ERROR', 'No fields to update');
        }

        await db('users').where({ id: req.user!.sub }).update(updates);

        const user = await db('users')
          .where({ id: req.user!.sub })
          .select('id', 'name', 'email', 'role', 'company', 'phone')
          .first();

        res.json({ success: true, data: { user } });
      }),
    );

    // POST /users/me/password
    router.post(
      '/users/me/password',
      requireAuth,
      validate({ body: changePasswordSchema }),
      asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;

        const user = await db('users').where({ id: req.user!.sub }).first();
        if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');

        const valid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!valid) {
          throw new ApiError(401, 'UNAUTHENTICATED', 'Current password is incorrect');
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await db('users').where({ id: req.user!.sub }).update({ password_hash: hash });

        res.json({ success: true, data: { message: 'Password updated' } });
      }),
    );
  },
};

export default authModule;

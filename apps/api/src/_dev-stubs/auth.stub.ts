import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { ModuleContext } from '@meetmaze/shared/contracts';
import { ApiError } from '@meetmaze/shared/core';
import { SEED_IDS } from '@meetmaze/shared/domain';

const DEMO_PASSWORD = 'Demo@1234';

const seedUsers = [
  { id: SEED_IDS.users.owner, name: 'Anita Rao', email: 'owner@meetmaze.dev', role: 'OWNER' as const, company: 'Orbit Workspaces' },
  { id: SEED_IDS.users.client, name: 'Rahul Mehta', email: 'client@meetmaze.dev', role: 'CLIENT' as const, company: 'Nimbus Tech' },
  { id: SEED_IDS.users.client2, name: 'Priya Sharma', email: 'priya@meetmaze.dev', role: 'CLIENT' as const, company: 'Nimbus Tech' },
  { id: SEED_IDS.users.client3, name: 'Arjun Patel', email: 'arjun@meetmaze.dev', role: 'CLIENT' as const, company: 'Nimbus Tech' },
  { id: SEED_IDS.users.client4, name: 'Sneha Das', email: 'sneha@meetmaze.dev', role: 'CLIENT' as const, company: 'Nimbus Tech' },
];

let hashedPassword: string | null = null;

export default {
  register: async (ctx: ModuleContext) => {
    hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const config = ctx.config as Record<string, any>;
    const router = ctx.router;
    const logger = ctx.logger as any;

    logger.info('[STUB] auth loaded');

    router.post('/auth/register', async (req, res, next) => {
      try {
        const { name, email, password, role, company, phone } = req.body;
        if (!name || !email || !password || !role) {
          throw new ApiError(400, 'VALIDATION_ERROR', 'name, email, password, role required');
        }
        const existing = seedUsers.find(u => u.email === email);
        if (existing) throw new ApiError(409, 'CONFLICT', 'Email already in use');

        const id = crypto.randomUUID();
        const hash = await bcrypt.hash(password, 10);
        seedUsers.push({ id, name, email, role, company: company || null } as any);

        const token = jwt.sign({ sub: id, role, email, name }, config.jwt?.secret || 'change-me', { expiresIn: '7d' });
        res.cookie(config.cookieName || 'mm_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.status(201).json({ success: true, data: { id, name, email, role, company } });
      } catch (e) { next(e); }
    });

    router.post('/auth/login', async (req, res, next) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) throw new ApiError(400, 'VALIDATION_ERROR', 'email and password required');

        const user = seedUsers.find(u => u.email === email);
        if (!user) throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid credentials');

        const valid = await bcrypt.compare(password, hashedPassword!);
        if (!valid) throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid credentials');

        const token = jwt.sign(
          { sub: user.id, role: user.role, email: user.email, name: user.name },
          config.jwt?.secret || 'change-me',
          { expiresIn: '7d' },
        );
        res.cookie(config.cookieName || 'mm_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company } });
      } catch (e) { next(e); }
    });

    router.post('/auth/logout', (_req, res) => {
      res.clearCookie(config.cookieName || 'mm_token');
      res.json({ success: true, data: { message: 'Logged out' } });
    });

    router.get('/auth/me', (req, res, next) => {
      try {
        const token = req.cookies?.[config.cookieName || 'mm_token'] || req.headers.authorization?.replace('Bearer ', '');
        if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Not authenticated');

        const payload = jwt.verify(token, config.jwt?.secret || 'change-me') as any;
        const user = seedUsers.find(u => u.id === payload.sub);
        if (!user) throw new ApiError(401, 'UNAUTHENTICATED', 'User not found');

        res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company } });
      } catch (e) { next(e); }
    });
  },
};

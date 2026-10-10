import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { errorHandler } from './errors.js';
import { db } from './db.js';
import { logger } from './logger.js';
import { serviceRegistry, getRegisteredServices } from './registry.js';
import { successResponse } from '@meetmaze/shared/core';
import type { ApiModule, ModuleContext } from '@meetmaze/shared/contracts';

export async function createApp(modules: ApiModule[]) {
  const app = express();

  // Global middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.webUrl, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  const apiRouter = express.Router();

  // Health check
  apiRouter.get('/health', async (_req, res) => {
    let dbOk = false;
    try {
      await db.raw('SELECT 1');
      dbOk = true;
    } catch { /* db unreachable */ }
    const services = getRegisteredServices();
    res.json(successResponse({
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk,
      services: services.map(s => ({ name: s.name, stub: s.stub })),
      stubs: config.enableDevStubs,
    }));
  });

  // Modules endpoint
  apiRouter.get('/_modules', (_req, res) => {
    const services = getRegisteredServices();
    res.json(successResponse({
      modules: modules.map(m => ({
        name: m.name,
        part: m.part,
        provides: m.provides ?? [],
        requires: m.requires ?? [],
      })),
      services: services.map(s => ({ name: s.name, stub: s.stub })),
    }));
  });

  // Register all modules
  for (const mod of modules) {
    const router = express.Router();
    const ctx: ModuleContext = {
      app,
      router,
      db,
      config: config as unknown as Record<string, unknown>,
      logger,
      services: serviceRegistry,
    };
    await mod.register(ctx);
    apiRouter.use(router);
    logger.info(`Module "${mod.name}" (part ${mod.part}) registered`);
  }

  // Load dev stubs if enabled
  if (config.enableDevStubs) {
    const { loadStubs } = await import('../_dev-stubs/loader.js');
    await loadStubs(serviceRegistry, db, logger, config as Record<string, unknown>, apiRouter);
  }

  // Verify required services
  for (const mod of modules) {
    for (const req of mod.requires ?? []) {
      if (!serviceRegistry.has(req)) {
        throw new Error(`Module "${mod.name}" requires service "${req}" but it was not provided`);
      }
    }
  }

  app.use('/api/v1', apiRouter);

  // Error handler
  app.use(errorHandler);

  return app;
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttpModule from 'pino-http';
import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './middleware.js';
import { db } from './db.js';
import { ServiceRegistryImpl } from './registry.js';
import type { ModuleContext } from '@meetmaze/shared/contracts';

export async function createApp() {
  const app = express();
  const services = new ServiceRegistryImpl();

  app.use(helmet());
  app.use(cors({ origin: config.webUrl, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  const pinoHttp = (pinoHttpModule as any).default ?? pinoHttpModule;
  app.use(pinoHttp({ logger }));

  const apiRouter = express.Router();

  // Health check
  apiRouter.get('/health', async (req, res) => {
    let dbOk = false;
    try { await db.raw('SELECT 1'); dbOk = true; } catch {}
    res.json({ success: true, data: { status: 'ok', db: dbOk, timestamp: new Date().toISOString() } });
  });

  // Modules endpoint
  apiRouter.get('/_modules', (req, res) => {
    res.json({
      success: true,
      data: services.list().map(s => ({
        service: s.name,
        mode: s.stub ? 'stubbed' : 'real',
      })),
    });
  });

  const ctx: ModuleContext = {
    app,
    router: apiRouter,
    db,
    config: config as Record<string, unknown>,
    logger,
    services,
  };

  // Load modules
  const modules = await import('./modules.generated.js').catch(() => ({ default: [] }));
  const moduleList = Array.isArray(modules.default) ? modules.default : [];

  for (const mod of moduleList) {
    await mod.register(ctx);
    logger.info({ module: mod.name, part: mod.part }, 'Module registered');
  }

  // Load stubs for missing services
  if (config.enableDevStubs) {
    const stubs = await import('../_dev-stubs/index.js').catch(() => ({ default: async () => {} }));
    await stubs.default(ctx);
  }

  // Validate requirements
  for (const mod of moduleList) {
    for (const req of mod.requires ?? []) {
      if (!services.has(req)) {
        throw new Error(`Module "${mod.name}" requires service "${req}" but it is not provided`);
      }
    }
  }

  // Start jobs
  if (!config.disableJobs) {
    for (const mod of moduleList) {
      for (const job of mod.jobs ?? []) {
        const interval = setInterval(async () => {
          try { await job.run(ctx); }
          catch (e) { logger.error({ job: job.name, err: e }, 'Job error'); }
        }, job.intervalMs);
        interval.unref();
        logger.info({ job: job.name, intervalMs: job.intervalMs }, 'Job started');
      }
    }
  }

  app.use('/api/v1', apiRouter);
  app.use(errorHandler as express.ErrorRequestHandler);

  return { app, db, services };
}

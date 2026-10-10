import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { config } from './config.js';
import { logger } from './logger.js';
import { errorHandler } from './middleware.js';
import { serviceRegistry } from './registry.js';
import { getDb, pingDb } from './db.js';
import { modules } from './modules.generated.js';
import type { ApiModule, ModuleContext, ServiceMap } from '@meetmaze/shared/contracts';

export async function createApp() {
  const app = express();

  // Global middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.webUrl, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  if (config.nodeEnv !== 'test') {
    app.use(pinoHttp({ logger: logger as any }));
  }

  const router = express.Router();
  const db = getDb();

  // Health check
  router.get('/health', async (_req, res) => {
    const dbOk = await pingDb();
    const info = serviceRegistry.getInfo();
    res.json({
      success: true,
      data: {
        status: dbOk ? 'healthy' : 'degraded',
        db: dbOk,
        services: info,
        jobs: config.disableJobs ? 'disabled' : 'active',
      },
    });
  });

  // Module registry endpoint
  router.get('/_modules', (_req, res) => {
    const info = serviceRegistry.getInfo();
    const moduleInfo = modules.map(m => ({
      name: m.name,
      part: m.part,
      provides: m.provides || [],
      requires: m.requires || [],
    }));
    res.json({
      success: true,
      data: {
        modules: moduleInfo,
        services: info,
      },
    });
  });

  // Build module context
  const ctx: ModuleContext = {
    app,
    router,
    db,
    config: config as unknown as Record<string, unknown>,
    logger,
    services: serviceRegistry,
  };

  // Phase 1: Register all modules
  for (const mod of modules) {
    logger.info(`Registering module: ${mod.name} (Part ${mod.part})`);
    const moduleRouter = express.Router();
    const moduleCtx: ModuleContext = { ...ctx, router: moduleRouter };
    await mod.register(moduleCtx);
    router.use(moduleRouter);
  }

  // Phase 2: Load dev stubs for missing services
  if (config.enableDevStubs) {
    logger.info('Dev stubs enabled — loading stubs for missing services...');
    const allServiceNames: (keyof ServiceMap)[] = ['rooms', 'bookings', 'search', 'insights', 'ranking', 'notifications'];
    for (const svcName of allServiceNames) {
      if (!serviceRegistry.has(svcName)) {
        try {
          const stubModule = await import(`../_dev-stubs/${svcName}.stub.js`);
          if (stubModule.default?.register) {
            await stubModule.default.register(ctx);
          } else if (stubModule.createStub) {
            serviceRegistry.provide(svcName, stubModule.createStub(ctx), { stub: true });
          }
          logger.info(`[STUB] ${svcName} loaded`);
        } catch (err) {
          logger.warn(`[STUB] Could not load stub for ${svcName}: ${err}`);
        }
      }
    }
    // Auth stub
    if (!modules.some(m => m.name === 'auth')) {
      try {
        const authStub = await import('../_dev-stubs/auth.stub.js');
        if (authStub.default?.register) {
          await authStub.default.register(ctx);
          logger.info('[STUB] auth loaded');
        }
      } catch (err) {
        logger.warn(`[STUB] Could not load auth stub: ${err}`);
      }
    }
  }

  // Phase 3: Verify all required services
  for (const mod of modules) {
    if (mod.requires) {
      for (const req of mod.requires) {
        if (!serviceRegistry.has(req)) {
          throw new Error(`Module "${mod.name}" requires service "${req}" but it is not registered`);
        }
      }
    }
  }

  // Phase 4: Start jobs
  const activeJobs: NodeJS.Timeout[] = [];
  if (!config.disableJobs) {
    for (const mod of modules) {
      if (mod.jobs) {
        for (const job of mod.jobs) {
          logger.info(`Starting job: ${job.name} (every ${job.intervalMs}ms)`);
          const interval = setInterval(async () => {
            try {
              await job.run(ctx);
            } catch (err) {
              logger.error({ err }, `Job "${job.name}" failed`);
            }
          }, job.intervalMs);
          activeJobs.push(interval);
          // Run immediately on boot
          job.run(ctx).catch(err => logger.error({ err }, `Job "${job.name}" initial run failed`));
        }
      }
    }
  }

  app.use('/api/v1', router);
  app.use(errorHandler);

  return { app, activeJobs };
}

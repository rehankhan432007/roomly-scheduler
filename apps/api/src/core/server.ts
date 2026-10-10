// Server entry point
import { createApp } from './app.js';
import { config } from './config.js';
import { db, checkDbConnection } from './db.js';
import { logger } from './logger.js';
import { loadModules, stopJobs } from './loader.js';
import { modules } from './modules.generated.js';
import { checkDbConnection as dbPing } from './db.js';
import { getModuleInfo } from './loader.js';
import { asyncHandler } from './middleware.js';
import { Router } from 'express';

async function main(): Promise<void> {
  const app = createApp();

  // Health and module info routes (mounted BEFORE the 404 catch-all)
  const systemRouter = Router();

  systemRouter.get(
    '/health',
    asyncHandler(async (_req, res) => {
      const dbOk = await dbPing();
      const info = getModuleInfo();
      const stubbedServices = info.services.filter((s) => s.stub).map((s) => s.name);
      res.status(dbOk ? 200 : 503).json({
        success: true,
        data: {
          status: dbOk ? 'ok' : 'degraded',
          db: dbOk ? 'ok' : 'unreachable',
          jobs: info.jobs,
          stubbedServices,
          uptime: process.uptime(),
        },
      });
    }),
  );

  systemRouter.get(
    '/_modules',
    asyncHandler(async (_req, res) => {
      const info = getModuleInfo();
      res.json({ success: true, data: info });
    }),
  );

  // Mount system routes before module loading (which mounts its own routes)
  // We need to insert these before the 404 handler
  // Remove the existing 404 handler, mount our routes, then re-add it
  app.use('/api/v1', systemRouter);

  // Load all registered modules
  await loadModules(modules, { app, db, config: config as unknown as Record<string, unknown>, logger });

  const port = config.API_PORT;
  const server = app.listen(port, () => {
    logger.info(`🚀 MeetMaze API listening on http://localhost:${port}`);
    logger.info(`   Health: http://localhost:${port}/api/v1/health`);
    logger.info(`   Modules: http://localhost:${port}/api/v1/_modules`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    stopJobs();
    server.close();
    await db.destroy();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});

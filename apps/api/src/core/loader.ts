// Module loader — boot order per B10
import type { ApiModule, ModuleContext } from '@meetmaze/shared/contracts';
import { config } from './config.js';
import { logger } from './logger.js';
import { serviceRegistry, ServiceRegistryImpl } from './registry.js';

interface JobRunner {
  name: string;
  intervalMs: number;
  timer?: ReturnType<typeof setInterval>;
  running: boolean;
  lastRun?: Date;
  lastError?: string;
}

const runningJobs: JobRunner[] = [];
let registeredModules: { module: ApiModule; ctx: ModuleContext }[] = [];

export async function loadModules(
  modules: ApiModule[],
  ctx: Omit<ModuleContext, 'router' | 'services'>,
): Promise<void> {
  const { app, db, logger: log } = ctx;
  const registry = serviceRegistry;

  // Phase 1: Register all modules
  for (const mod of modules) {
    const { Router } = await import('express');
    const router = Router();
    const moduleCtx: ModuleContext = {
      ...ctx,
      router,
      services: registry,
      config: config as unknown as Record<string, unknown>,
    };

    log.info(`Loading module: ${mod.name} (Part ${mod.part})`);
    await mod.register(moduleCtx);
    app.use('/api/v1', router);

    registeredModules.push({ module: mod, ctx: moduleCtx });
  }

  // Phase 2: Apply dev stubs for missing services
  if (config.ENABLE_DEV_STUBS) {
    log.info('Dev stubs enabled, loading stubs for missing services...');
    try {
      const { applyDevStubs } = await import('../_dev-stubs/index.js');
      await applyDevStubs(registry as ServiceRegistryImpl, { ...ctx, config: config as unknown as Record<string, unknown>, router: (await import('express')).Router(), services: registry } as ModuleContext);
    } catch (err) {
      log.warn('Could not load dev stubs:', err);
    }
  }

  // Phase 3: Verify all required services are present
  for (const { module: mod } of registeredModules) {
    if (mod.requires) {
      for (const svc of mod.requires) {
        if (!registry.has(svc)) {
          const msg = `Module "${mod.name}" requires service "${svc}" which is not registered. ` +
            `Set ENABLE_DEV_STUBS=true or import the part that provides it.`;
          log.error(msg);
          throw new Error(msg);
        }
      }
    }
  }

  // Phase 4: Start jobs
  if (!config.DISABLE_JOBS) {
    for (const { module: mod, ctx: moduleCtx } of registeredModules) {
      if (mod.jobs) {
        for (const job of mod.jobs) {
          const runner: JobRunner = {
            name: `${mod.name}.${job.name}`,
            intervalMs: job.intervalMs,
            running: false,
          };

          const run = async () => {
            if (runner.running) return;
            runner.running = true;
            try {
              await job.run(moduleCtx);
              runner.lastRun = new Date();
              runner.lastError = undefined;
            } catch (err) {
              runner.lastError = err instanceof Error ? err.message : String(err);
              log.error(`Job ${runner.name} failed:`, err);
            } finally {
              runner.running = false;
            }
          };

          runner.timer = setInterval(run, job.intervalMs);
          // Run immediately once
          run();
          runningJobs.push(runner);
          log.info(`Job "${runner.name}" started (interval: ${job.intervalMs}ms)`);
        }
      }
    }
  }
}

export function getModuleInfo(): {
  modules: { name: string; part: number; provides: string[]; requires: string[] }[];
  jobs: { name: string; running: boolean; lastRun?: string; lastError?: string }[];
  services: { name: string; stub: boolean }[];
} {
  return {
    modules: registeredModules.map(({ module: m }) => ({
      name: m.name,
      part: m.part,
      provides: (m.provides ?? []) as string[],
      requires: (m.requires ?? []) as string[],
    })),
    jobs: runningJobs.map((j) => ({
      name: j.name,
      running: j.running,
      lastRun: j.lastRun?.toISOString(),
      lastError: j.lastError,
    })),
    services: serviceRegistry.listServices(),
  };
}

export function stopJobs(): void {
  for (const job of runningJobs) {
    if (job.timer) clearInterval(job.timer);
  }
  runningJobs.length = 0;
}

import type { InsightsService, ModuleContext } from '@meetmaze/shared/contracts';

export function createInsightsStub(ctx: ModuleContext): InsightsService {
  const log = ctx.logger;
  return {
    async getBusyWarning(q) { log.info(`[STUB] insights.getBusyWarning`); return null; },
    async recompute() { log.info(`[STUB] insights.recompute`); },
  };
}

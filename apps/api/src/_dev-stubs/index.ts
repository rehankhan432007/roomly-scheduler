// Dev stubs index — applies stub implementations for missing services
import type { ServiceRegistryImpl } from '../core/registry.js';
import type { ModuleContext } from '@meetmaze/shared/contracts';
import { createRoomsStub } from './rooms.stub.js';
import { createBookingsStub } from './bookings.stub.js';
import { createSearchStub } from './search.stub.js';
import { createInsightsStub } from './insights.stub.js';
import { createRankingStub } from './ranking.stub.js';
import { createNotificationsStub } from './notifications.stub.js';

export async function applyDevStubs(
  registry: ServiceRegistryImpl,
  ctx: ModuleContext,
): Promise<void> {
  const log = ctx.logger;

  if (!registry.has('rooms')) {
    log.info('[STUB] Providing rooms service stub');
    registry.provide('rooms', createRoomsStub(ctx), { stub: true });
  }
  if (!registry.has('bookings')) {
    log.info('[STUB] Providing bookings service stub');
    registry.provide('bookings', createBookingsStub(ctx), { stub: true });
  }
  if (!registry.has('search')) {
    log.info('[STUB] Providing search service stub');
    registry.provide('search', createSearchStub(ctx), { stub: true });
  }
  if (!registry.has('insights')) {
    log.info('[STUB] Providing insights service stub');
    registry.provide('insights', createInsightsStub(ctx), { stub: true });
  }
  if (!registry.has('ranking')) {
    log.info('[STUB] Providing ranking service stub');
    registry.provide('ranking', createRankingStub(ctx), { stub: true });
  }
  if (!registry.has('notifications')) {
    log.info('[STUB] Providing notifications service stub');
    registry.provide('notifications', createNotificationsStub(ctx), { stub: true });
  }
}

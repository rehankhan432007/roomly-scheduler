import type { Knex } from 'knex';
import type { ServiceRegistry } from '@meetmaze/shared/contracts';
import { BookingServiceStub } from './bookings.stub.js';
import { SearchServiceStub } from './search.stub.js';
import { InsightsServiceStub } from './insights.stub.js';
import { RankingServiceStub } from './ranking.stub.js';
import { NotificationServiceStub } from './notifications.stub.js';
import { createAuthStubRoutes } from './auth.stub.js';

import type { Router } from 'express';

export async function loadStubs(
  services: ServiceRegistry,
  db: Knex,
  logger: unknown,
  config: Record<string, unknown>,
  router: Router
) {
  // Only provide if not already provided by a real module
  services.provide('bookings', new BookingServiceStub(), { stub: true });
  services.provide('search', new SearchServiceStub(), { stub: true });
  services.provide('insights', new InsightsServiceStub(), { stub: true });
  services.provide('ranking', new RankingServiceStub(), { stub: true });
  services.provide('notifications', new NotificationServiceStub(), { stub: true });

  // Add auth routes if auth module is not present
  // The stub routes will be mounted in the main app if no real module exists
  // but for simplicity, we'll just check if auth is registered (Part 1 owns auth)
  // Actually, we can just let the app mount it conditionally.
  // We'll export the auth stub function so `app.ts` can mount it.
  const hasAuthRoutes = router.stack.some(r => r.route && r.route.path === '/auth/login');
  if (!hasAuthRoutes) {
    const authRoutes = createAuthStubRoutes(db, config);
    router.use(authRoutes);
  }
}

export { createAuthStubRoutes };

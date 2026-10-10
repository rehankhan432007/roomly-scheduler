import type { ApiModule } from '@meetmaze/shared/contracts';
import { mountBookingRoutes } from './routes/booking.routes.js';
import { createBookingService } from './service/booking.service.js';
import { logger } from '../../core/logger.js';

const bookingsModule: ApiModule = {
  name: 'bookings',
  part: 3,
  provides: ['bookings'],
  requires: ['rooms', 'notifications'],

  async register(ctx) {
    const { config, db, services } = ctx;
    const holdTtl = (config as Record<string, number>)['holdTtlSeconds'] ?? 300;

    // Mount routes
    mountBookingRoutes(ctx);

    // Provide BookingService
    const svc = createBookingService(
      db,
      () => services.get('rooms'),
      () => services.get('notifications'),
      holdTtl
    );
    services.provide('bookings', svc);
  },

  jobs: [
    {
      name: 'expire-holds',
      intervalMs: 15_000,
      async run(ctx) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const expired = await ctx.db('bookings')
          .where('status', 'HELD')
          .where('hold_expires_at', '<', now);
        if (expired.length > 0) {
          await ctx.db('bookings')
            .where('status', 'HELD')
            .where('hold_expires_at', '<', now)
            .update({ status: 'RELEASED', cancel_reason: 'hold expired' });
          logger.info({ count: expired.length }, 'Expired holds released');
        }
      },
    },
    {
      name: 'complete-bookings',
      intervalMs: 60_000,
      async run(ctx) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        // Only mark CHECKED_IN as COMPLETED when end_at < now
        // CONFIRMED bookings that weren't checked in are handled by Part 4's release job
        const completed = await ctx.db('bookings')
          .where('status', 'CHECKED_IN')
          .where('end_at', '<', now);
        if (completed.length > 0) {
          await ctx.db('bookings')
            .where('status', 'CHECKED_IN')
            .where('end_at', '<', now)
            .update({ status: 'COMPLETED' });
          logger.info({ count: completed.length }, 'Bookings marked COMPLETED');
        }
      },
    },
  ],
};

export default bookingsModule;

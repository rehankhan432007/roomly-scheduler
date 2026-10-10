import type { ApiModule, ModuleContext, NotificationService, NotificationInput } from '@meetmaze/shared/contracts';
import { Router } from 'express';
import { z } from 'zod';
import { generateId, PaginationQuery } from '@meetmaze/shared/core';
import { requireAuth, validate, ok } from '../../core/middleware.js';

// ---- Service implementation ----
function createNotificationService(ctx: ModuleContext): NotificationService {
  const db = ctx.db;
  const logger = ctx.logger as any;

  return {
    async notify(userId: string, n: NotificationInput): Promise<void> {
      logger.info({ userId, type: n.type, title: n.title }, 'Creating notification');
      await db('notifications').insert({
        id: generateId(),
        user_id: userId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data ? JSON.stringify(n.data) : null,
      });
    },
  };
}

// ---- Jobs ----
async function reviewRequestsJob(ctx: ModuleContext): Promise<void> {
  const logger = ctx.logger as any;
  const db = ctx.db;
  const notifService = ctx.services.get('notifications');

  try {
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60000);
    const sixtyMinAgo = new Date(now.getTime() - 60 * 60000);

    // Find bookings ended 10-60 min ago, CHECKED_IN or COMPLETED, no review, no prior REVIEW_REQUESTED notification
    const bookings = await db('bookings')
      .whereIn('status', ['CHECKED_IN', 'COMPLETED'])
      .where('end_at', '<=', tenMinAgo)
      .where('end_at', '>=', sixtyMinAgo)
      .whereNotExists(function () {
        this.select('id').from('reviews').whereRaw('reviews.booking_id = bookings.id');
      })
      .whereNotExists(function () {
        this.select('id').from('notifications')
          .where('type', 'REVIEW_REQUESTED')
          .whereRaw("JSON_EXTRACT(data, '$.bookingId') = bookings.id");
      })
      .select('bookings.id', 'bookings.client_id', 'bookings.room_id', 'bookings.title');

    for (const b of bookings) {
      try {
        const room = await db('rooms').where('id', b.room_id).first();
        const roomName = room?.name ?? 'the room';
        await notifService.notify(b.client_id, {
          type: 'REVIEW_REQUESTED',
          title: `How was ${roomName}?`,
          body: 'Rate it in 10 seconds — your feedback helps rank rooms for everyone.',
          data: { bookingId: b.id, roomId: b.room_id },
        });
      } catch (err) {
        logger.error({ err, bookingId: b.id }, 'Failed to send review request');
      }
    }
    if (bookings.length > 0) logger.info(`Sent ${bookings.length} review requests`);
  } catch (err) {
    logger.error({ err }, 'review-requests job failed');
  }
}

async function bookingRemindersJob(ctx: ModuleContext): Promise<void> {
  const logger = ctx.logger as any;
  const db = ctx.db;
  const notifService = ctx.services.get('notifications');

  try {
    const now = new Date();
    const fourteenMinLater = new Date(now.getTime() + 14 * 60000);
    const fifteenMinLater = new Date(now.getTime() + 15 * 60000);

    const bookings = await db('bookings')
      .where('status', 'CONFIRMED')
      .where('start_at', '>=', fourteenMinLater)
      .where('start_at', '<=', fifteenMinLater)
      .whereNotExists(function () {
        this.select('id').from('notifications')
          .where('type', 'BOOKING_REMINDER')
          .whereRaw("JSON_EXTRACT(data, '$.bookingId') = bookings.id");
      })
      .select('bookings.id', 'bookings.client_id', 'bookings.room_id', 'bookings.title');

    for (const b of bookings) {
      try {
        const room = await db('rooms').where('id', b.room_id).first();
        const roomName = room?.name ?? 'the room';
        await notifService.notify(b.client_id, {
          type: 'BOOKING_REMINDER',
          title: `Your meeting starts soon`,
          body: `Scan the QR at ${roomName} to check in within 15 minutes of the start.`,
          data: { bookingId: b.id, roomId: b.room_id },
        });
      } catch (err) {
        logger.error({ err, bookingId: b.id }, 'Failed to send booking reminder');
      }
    }
    if (bookings.length > 0) logger.info(`Sent ${bookings.length} booking reminders`);
  } catch (err) {
    logger.error({ err }, 'booking-reminders job failed');
  }
}

// ---- Module ----
const notificationsModule: ApiModule = {
  name: 'notifications',
  part: 4,
  provides: ['notifications'],

  async register(ctx: ModuleContext): Promise<void> {
    const service = createNotificationService(ctx);
    ctx.services.provide('notifications', service);

    const router = ctx.router;
    const db = ctx.db;

    // GET /notifications — list my notifications
    router.get('/notifications', requireAuth, validate({ query: PaginationQuery.extend({ unread: z.string().optional() }) }), async (req, res, next) => {
      try {
        const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
        const unreadOnly = (req.query as any).unread === 'true';
        const userId = req.user!.sub;
        const offset = (page - 1) * pageSize;

        let query = db('notifications').where('user_id', userId);
        if (unreadOnly) query = query.whereNull('read_at');

        const [{ count }] = await query.clone().count('* as count');
        const total = Number(count);

        const unreadCountResult = await db('notifications').where('user_id', userId).whereNull('read_at').count('* as count');
        const unreadCount = Number(unreadCountResult[0].count);

        const items = await query.orderBy('created_at', 'desc').limit(pageSize).offset(offset).select('*');

        const data = items.map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          type: n.type,
          title: n.title,
          body: n.body,
          data: typeof n.data === 'string' ? JSON.parse(n.data) : n.data,
          readAt: n.read_at?.toISOString() ?? null,
          createdAt: n.created_at?.toISOString() ?? n.created_at,
        }));

        ok(res, data, { page, pageSize, total, unreadCount } as any);
      } catch (e) { next(e); }
    });

    // POST /notifications/:id/read
    router.post('/notifications/:id/read', requireAuth, async (req, res, next) => {
      try {
        const userId = req.user!.sub;
        const updated = await db('notifications')
          .where({ id: req.params.id, user_id: userId })
          .whereNull('read_at')
          .update({ read_at: new Date() });
        ok(res, { success: updated > 0 });
      } catch (e) { next(e); }
    });

    // POST /notifications/read-all
    router.post('/notifications/read-all', requireAuth, async (req, res, next) => {
      try {
        const userId = req.user!.sub;
        await db('notifications').where('user_id', userId).whereNull('read_at').update({ read_at: new Date() });
        ok(res, { success: true });
      } catch (e) { next(e); }
    });
  },

  jobs: [
    { name: 'review-requests', intervalMs: 5 * 60 * 1000, run: reviewRequestsJob },
    { name: 'booking-reminders', intervalMs: 60 * 1000, run: bookingRemindersJob },
  ],
};

export default notificationsModule;

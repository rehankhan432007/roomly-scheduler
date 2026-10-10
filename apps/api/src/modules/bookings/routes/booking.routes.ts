import { Router } from 'express';
import type { ModuleContext } from '@meetmaze/shared/contracts';
import { requireAuth, requireRole } from '../../../core/auth.js';
import { validate } from '../../../core/middleware.js';
import { z } from 'zod';
import { CreateBookingSchema, CancelBookingSchema, RescheduleBookingSchema, CheckConflictsSchema } from '@meetmaze/shared/modules/booking';
import { createBookingService, validateBooking, findAlternatives } from '../service/booking.service.js';
import { getBookingWithParticipants } from '../repository/booking.repo.js';
import { parseISO } from 'date-fns';
import { ApiError } from '@meetmaze/shared/core';

export function mountBookingRoutes(ctx: ModuleContext): void {
  const { router, db, config, services } = ctx;
  const holdTtl = (config as Record<string, number>)['holdTtlSeconds'] ?? 300;

  const getBookingSvc = () => createBookingService(
    db,
    () => services.get('rooms'),
    () => services.get('notifications'),
    holdTtl
  );

  // POST /bookings/check-conflicts
  router.post('/bookings/check-conflicts', requireRole('CLIENT'), validate({ body: CheckConflictsSchema }), async (req, res, next) => {
    try {
      const rooms = services.get('rooms');
      const result = await validateBooking(db, req.body, rooms);
      const alternatives = result.ok ? [] : await findAlternatives(db, req.body.roomId, parseISO(req.body.startAt), parseISO(req.body.endAt), rooms);
      res.json({ success: true, data: { ok: result.ok, reasons: result.reasons, alternatives } });
    } catch (e) { next(e); }
  });

  // POST /bookings/hold
  router.post('/bookings/hold', requireRole('CLIENT'), validate({ body: CreateBookingSchema }), async (req, res, next) => {
    try {
      const svc = getBookingSvc();
      const booking = await svc.createHold(req.body, { userId: req.user!.sub });
      res.status(201).json({ success: true, data: booking });
    } catch (e) { next(e); }
  });

  // POST /bookings/:id/confirm
  router.post('/bookings/:id/confirm', requireRole('CLIENT'), async (req, res, next) => {
    try {
      const svc = getBookingSvc();
      const booking = await svc.confirm(req.params.id, { userId: req.user!.sub });
      res.json({ success: true, data: booking });
    } catch (e) { next(e); }
  });

  // POST /bookings/:id/cancel
  router.post('/bookings/:id/cancel', requireRole('CLIENT'), validate({ body: CancelBookingSchema }), async (req, res, next) => {
    try {
      const svc = getBookingSvc();
      const booking = await svc.cancel(req.params.id, { userId: req.user!.sub }, req.body.reason);
      res.json({ success: true, data: booking });
    } catch (e) { next(e); }
  });

  // POST /bookings — hold + confirm atomically
  router.post('/bookings', requireRole('CLIENT'), validate({ body: CreateBookingSchema }), async (req, res, next) => {
    try {
      const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;
      const svc = getBookingSvc();
      const held = await svc.createHold({ ...req.body, idempotencyKey }, { userId: req.user!.sub });
      const confirmed = await svc.confirm(held.id, { userId: req.user!.sub });
      res.status(201).json({ success: true, data: confirmed });
    } catch (e) { next(e); }
  });

  // GET /bookings
  router.get('/bookings', requireRole('CLIENT'), async (req, res, next) => {
    try {
      const scope = (req.query.scope as string) || 'upcoming';
      if (!['upcoming', 'past', 'cancelled'].includes(scope)) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'scope must be upcoming|past|cancelled');
      }
      const svc = getBookingSvc();
      const bookings = await svc.listMine(req.user!.sub, scope as 'upcoming' | 'past' | 'cancelled');
      res.json({ success: true, data: bookings });
    } catch (e) { next(e); }
  });

  // GET /bookings/:id
  router.get('/bookings/:id', requireAuth, async (req, res, next) => {
    try {
      const booking = await getBookingWithParticipants(db, req.params.id);
      if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
      // Client can see own; owner can see if their room
      if (booking.clientId !== req.user!.sub) {
        const ownerId = await services.get('rooms').getOwnerId(booking.roomId);
        if (ownerId !== req.user!.sub) throw new ApiError(403, 'FORBIDDEN', 'Access denied');
      }
      res.json({ success: true, data: booking });
    } catch (e) { next(e); }
  });

  // GET /me/calendar?from&to
  router.get('/me/calendar', requireAuth, async (req, res, next) => {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      let q = db('bookings').where('client_id', req.user!.sub).whereNotIn('status', ['CANCELLED', 'RELEASED']);
      if (from) q = q.where('end_at', '>=', from);
      if (to) q = q.where('start_at', '<=', to);
      const rows = await q.orderBy('start_at');
      const result = await Promise.all(rows.map(async (r: Record<string, unknown>) => {
        const parts = await db('booking_participants').where('booking_id', r['id'] as string).select('email', 'name', 'status');
        const { rowToDto } = await import('../repository/booking.repo.js');
        return rowToDto(r, parts);
      }));
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  });

  // PATCH /bookings/:id — reschedule
  router.patch('/bookings/:id', requireRole('CLIENT'), validate({ body: RescheduleBookingSchema }), async (req, res, next) => {
    try {
      const booking = await db('bookings').where('id', req.params.id).first();
      if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
      if (booking.client_id !== req.user!.sub) throw new ApiError(403, 'FORBIDDEN', 'Not your booking');
      if (booking.status !== 'CONFIRMED') throw new ApiError(409, 'CONFLICT', 'Only confirmed bookings can be rescheduled');

      const rooms = services.get('rooms');
      const input = { ...booking, startAt: req.body.startAt, endAt: req.body.endAt, roomId: booking.room_id, attendeeCount: booking.attendee_count, requiredEquipment: JSON.parse(booking.required_equipment ?? '[]') };
      const validation = await validateBooking(db, input, rooms, req.params.id);
      if (!validation.ok) throw new ApiError(409, 'SLOT_UNAVAILABLE', 'New slot unavailable', { reasons: validation.reasons });

      await db('bookings').where('id', req.params.id).update({
        start_at: parseISO(req.body.startAt).toISOString().slice(0, 19).replace('T', ' '),
        end_at: parseISO(req.body.endAt).toISOString().slice(0, 19).replace('T', ' '),
      });
      const updated = await getBookingWithParticipants(db, req.params.id);
      res.json({ success: true, data: updated });
    } catch (e) { next(e); }
  });
}

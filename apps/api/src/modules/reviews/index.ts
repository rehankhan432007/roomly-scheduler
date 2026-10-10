import type { ApiModule, ModuleContext } from '@meetmaze/shared/contracts';
import { z } from 'zod';
import { ApiError, generateId, PaginationQuery } from '@meetmaze/shared/core';
import { CreateReviewInput, CreateIssueInput } from '@meetmaze/shared/modules/experience';
import { requireAuth, requireRole, validate, ok, created, optionalAuth } from '../../core/middleware.js';

const reviewsModule: ApiModule = {
  name: 'reviews',
  part: 4,
  requires: ['rooms', 'bookings', 'ranking', 'notifications'],

  async register(ctx: ModuleContext): Promise<void> {
    const { router, db } = ctx;
    const logger = ctx.logger as any;
    const rooms = () => ctx.services.get('rooms');
    const bookings = () => ctx.services.get('bookings');
    const ranking = () => ctx.services.get('ranking');
    const notifications = () => ctx.services.get('notifications');

    // POST /reviews
    router.post('/reviews', requireAuth, validate({ body: CreateReviewInput }), async (req, res, next) => {
      try {
        const userId = req.user!.sub;
        const { bookingId, rating, comment, tags } = req.body as CreateReviewInput;

        // Booking must belong to caller
        const booking = await bookings().getBooking(bookingId);
        if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
        if (booking.clientId !== userId) throw new ApiError(403, 'FORBIDDEN', 'Not your booking');
        if (!['CHECKED_IN', 'COMPLETED'].includes(booking.status)) {
          throw new ApiError(400, 'VALIDATION_ERROR', 'Can only review checked-in or completed bookings');
        }
        if (new Date(booking.endAt) > new Date()) {
          throw new ApiError(400, 'VALIDATION_ERROR', 'Meeting has not ended yet');
        }

        // No existing review
        const existing = await db('reviews').where('booking_id', bookingId).first();
        if (existing) throw new ApiError(409, 'CONFLICT', 'You have already reviewed this booking');

        const id = generateId();
        await db('reviews').insert({
          id, booking_id: bookingId, room_id: booking.roomId, reviewer_id: userId,
          rating, comment: comment ?? null, tags: JSON.stringify(tags ?? []),
        });

        // Recompute ranking
        await ranking().recomputeRoom(booking.roomId);

        // Notify owner
        const ownerId = await rooms().getOwnerId(booking.roomId);
        const room = await rooms().getRoomSummary(booking.roomId);
        if (ownerId && room) {
          await notifications().notify(ownerId, {
            type: 'REVIEW_REQUESTED',
            title: `New ${rating}/10 review for ${room.name}`,
            body: comment || 'No comment',
            data: { bookingId, roomId: booking.roomId, reviewId: id },
          });
        }

        ok(res, { id, bookingId, roomId: booking.roomId, rating, comment, tags }, undefined, 201);
      } catch (e) { next(e); }
    });

    // GET /rooms/:id/reviews — public
    router.get('/rooms/:id/reviews', optionalAuth, validate({ query: PaginationQuery }), async (req, res, next) => {
      try {
        const roomId = req.params.id;
        const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };

        // Summary
        const summaryRow = await db('room_stats').where('room_id', roomId).first();
        const summary = {
          avg: summaryRow?.avg_rating ? Number(summaryRow.avg_rating) : null,
          count: Number(summaryRow?.review_count ?? 0),
          bayes: summaryRow?.bayes_rating ? Number(summaryRow.bayes_rating) : null,
        };

        // Histogram
        const histRows = await db('reviews').where('room_id', roomId)
          .select('rating').count('* as count').groupBy('rating');
        const histogram: Record<number, number> = {};
        for (let i = 1; i <= 10; i++) histogram[i] = 0;
        for (const row of histRows) histogram[Number(row.rating)] = Number(row.count);

        // Tag counts
        const allReviews = await db('reviews').where('room_id', roomId).select('tags');
        const tagCounts: Record<string, number> = {};
        for (const r of allReviews) {
          const t = typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags ?? []);
          for (const tag of t) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }

        // Items (paginated)
        const offset = (page - 1) * pageSize;
        const [{ count: total }] = await db('reviews').where('room_id', roomId).count('* as count');
        const items = await db('reviews as r')
          .join('users as u', 'r.reviewer_id', 'u.id')
          .where('r.room_id', roomId)
          .orderBy('r.created_at', 'desc')
          .limit(pageSize).offset(offset)
          .select('r.rating', 'r.comment', 'r.tags', 'u.name as reviewer_name', 'r.created_at');

        const formattedItems = items.map((i: any) => ({
          rating: Number(i.rating),
          comment: i.comment,
          tags: typeof i.tags === 'string' ? JSON.parse(i.tags) : (i.tags ?? []),
          reviewerName: formatReviewerName(i.reviewer_name),
          createdAt: i.created_at?.toISOString?.() ?? i.created_at,
        }));

        ok(res, { summary, histogram, tagCounts, items: formattedItems }, { page, pageSize, total: Number(total) });
      } catch (e) { next(e); }
    });

    // GET /me/reviews/pending
    router.get('/me/reviews/pending', requireAuth, async (req, res, next) => {
      try {
        const userId = req.user!.sub;
        const pending = await db('bookings')
          .where('client_id', userId)
          .whereIn('status', ['CHECKED_IN', 'COMPLETED'])
          .where('end_at', '<', new Date())
          .whereNotExists(function () {
            this.select('id').from('reviews').whereRaw('reviews.booking_id = bookings.id');
          })
          .orderBy('end_at', 'desc')
          .limit(20)
          .select('*');

        const data = pending.map((b: any) => ({
          id: b.id, roomId: b.room_id, title: b.title, startAt: b.start_at?.toISOString?.() ?? b.start_at,
          endAt: b.end_at?.toISOString?.() ?? b.end_at, status: b.status,
        }));
        ok(res, data);
      } catch (e) { next(e); }
    });

    // GET /owner/reviews
    router.get('/owner/reviews', requireAuth, requireRole('OWNER'), validate({ query: PaginationQuery.extend({
      roomId: z.string().uuid().optional(),
      minRating: z.coerce.number().int().min(1).max(10).optional(),
    }) }), async (req, res, next) => {
      try {
        const ownerId = req.user!.sub;
        const { page, pageSize, roomId, minRating } = req.query as any;
        const offset = (page - 1) * pageSize;

        let query = db('reviews as r')
          .join('rooms as rm', 'r.room_id', 'rm.id')
          .join('users as u', 'r.reviewer_id', 'u.id')
          .where('rm.owner_id', ownerId);
        if (roomId) query = query.where('r.room_id', roomId);
        if (minRating) query = query.where('r.rating', '>=', minRating);

        const [{ count: total }] = await query.clone().count('* as count');
        const items = await query.orderBy('r.created_at', 'desc').limit(pageSize).offset(offset)
          .select('r.id', 'r.rating', 'r.comment', 'r.tags', 'r.created_at', 'rm.name as room_name', 'u.name as reviewer_name', 'r.room_id');

        const data = items.map((i: any) => ({
          id: i.id, roomId: i.room_id, roomName: i.room_name, rating: Number(i.rating),
          comment: i.comment, tags: typeof i.tags === 'string' ? JSON.parse(i.tags) : (i.tags ?? []),
          reviewerName: formatReviewerName(i.reviewer_name),
          createdAt: i.created_at?.toISOString?.() ?? i.created_at,
        }));
        ok(res, data, { page, pageSize, total: Number(total) });
      } catch (e) { next(e); }
    });

    // POST /issues
    router.post('/issues', requireAuth, validate({ body: CreateIssueInput }), async (req, res, next) => {
      try {
        const userId = req.user!.sub;
        const body = req.body as CreateIssueInput;

        // Reporter must have a booking for this room
        const hasBooking = await db('bookings')
          .where({ room_id: body.roomId, client_id: userId })
          .whereIn('status', ['CHECKED_IN', 'COMPLETED'])
          .first();
        if (!hasBooking) throw new ApiError(403, 'FORBIDDEN', 'You must have a completed booking for this room');

        // Resolve equipment type id if equipment code provided
        let equipmentTypeId: string | null = null;
        if (body.equipmentCode) {
          const et = await db('equipment_types').where('code', body.equipmentCode).first();
          if (et) equipmentTypeId = et.id;
        }

        const id = generateId();
        await db('room_issues').insert({
          id, room_id: body.roomId, booking_id: body.bookingId ?? null,
          reporter_id: userId, equipment_type_id: equipmentTypeId,
          issue_type: body.issueType, description: body.description ?? null,
        });

        // EQUIPMENT_BROKEN → flag equipment
        if (body.issueType === 'EQUIPMENT_BROKEN' && body.equipmentCode) {
          await rooms().flagEquipment(body.roomId, body.equipmentCode, body.description ?? 'Reported as broken');
        }

        // Recompute room stats
        await ranking().recomputeRoom(body.roomId);

        // Notify owner
        const ownerId = await rooms().getOwnerId(body.roomId);
        const room = await rooms().getRoomSummary(body.roomId);
        if (ownerId) {
          await notifications().notify(ownerId, {
            type: 'ISSUE_REPORTED',
            title: `Issue reported for ${room?.name ?? 'a room'}`,
            body: `${body.issueType}: ${body.description ?? 'No details'}`,
            data: { issueId: id, roomId: body.roomId },
          });
        }

        created(res, { id, roomId: body.roomId, issueType: body.issueType, status: 'OPEN' });
      } catch (e) { next(e); }
    });

    // GET /owner/issues
    router.get('/owner/issues', requireAuth, requireRole('OWNER'), validate({ query: PaginationQuery.extend({
      status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
      roomId: z.string().uuid().optional(),
    }) }), async (req, res, next) => {
      try {
        const ownerId = req.user!.sub;
        const { page, pageSize, status, roomId } = req.query as any;
        const offset = (page - 1) * pageSize;

        let query = db('room_issues as ri')
          .join('rooms as rm', 'ri.room_id', 'rm.id')
          .join('users as u', 'ri.reporter_id', 'u.id')
          .where('rm.owner_id', ownerId);
        if (status) query = query.where('ri.status', status);
        if (roomId) query = query.where('ri.room_id', roomId);

        const [{ count: total }] = await query.clone().count('* as count');
        const items = await query.orderBy('ri.created_at', 'desc').limit(pageSize).offset(offset)
          .select('ri.*', 'rm.name as room_name', 'u.name as reporter_name');

        const eqTypes = await db('equipment_types').select('id', 'code', 'name');
        const eqMap = new Map(eqTypes.map((e: any) => [e.id, e]));

        const data = items.map((i: any) => {
          const eq = i.equipment_type_id ? eqMap.get(i.equipment_type_id) : null;
          return {
            id: i.id, roomId: i.room_id, roomName: i.room_name, bookingId: i.booking_id,
            reporterId: i.reporter_id, reporterName: i.reporter_name,
            equipmentCode: eq?.code ?? null, equipmentName: eq?.name ?? null,
            issueType: i.issue_type, description: i.description, status: i.status,
            createdAt: i.created_at?.toISOString?.() ?? i.created_at,
            resolvedAt: i.resolved_at?.toISOString?.() ?? i.resolved_at,
          };
        });
        ok(res, data, { page, pageSize, total: Number(total) });
      } catch (e) { next(e); }
    });

    // PATCH /owner/issues/:id
    router.patch('/owner/issues/:id', requireAuth, requireRole('OWNER'), validate({ body: z.object({ status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']) }) }), async (req, res, next) => {
      try {
        const ownerId = req.user!.sub;
        const issueId = req.params.id;
        const { status } = req.body;

        const issue = await db('room_issues as ri')
          .join('rooms as rm', 'ri.room_id', 'rm.id')
          .where('ri.id', issueId).where('rm.owner_id', ownerId)
          .select('ri.*').first();
        if (!issue) throw new ApiError(404, 'NOT_FOUND', 'Issue not found');

        const updates: any = { status };
        if (status === 'RESOLVED') {
          updates.resolved_at = new Date();

          // Clear equipment flag if equipment issue and no other open issues for same equipment
          if (issue.equipment_type_id && issue.issue_type === 'EQUIPMENT_BROKEN') {
            const otherOpen = await db('room_issues')
              .where({ room_id: issue.room_id, equipment_type_id: issue.equipment_type_id, status: 'OPEN' })
              .whereNot('id', issueId).first();
            if (!otherOpen) {
              const eqType = await db('equipment_types').where('id', issue.equipment_type_id).first();
              if (eqType) await rooms().clearEquipmentFlag(issue.room_id, eqType.code);
            }
          }

          // Recompute stats
          await ranking().recomputeRoom(issue.room_id);

          // Notify reporter
          await notifications().notify(issue.reporter_id, {
            type: 'ISSUE_RESOLVED',
            title: 'Your issue has been resolved',
            body: `The issue you reported has been marked as resolved.`,
            data: { issueId, roomId: issue.room_id },
          });
        }

        await db('room_issues').where('id', issueId).update(updates);
        ok(res, { id: issueId, status });
      } catch (e) { next(e); }
    });
  },
};

function formatReviewerName(name: string): string {
  if (!name) return 'Anonymous';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export default reviewsModule;

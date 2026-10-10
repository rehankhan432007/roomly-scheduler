import type { Knex } from 'knex';
import { ApiError } from '@meetmaze/shared/core';
import type { BookingService, RoomsService, NotificationService, CreateBookingInput, BookingDto, ConflictReport, AlternativeSlot } from '@meetmaze/shared/contracts';
import { v4 as uuid } from 'uuid';
import { addMinutes, differenceInMinutes, parseISO, isAfter, isBefore } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { rowToDto, getBookingWithParticipants, insertParticipants, getBlockingBookings } from '../repository/booking.repo.js';

export interface ValidationResult {
  ok: boolean;
  reasons: ConflictReport['reasons'];
}

export async function validateBooking(
  db: Knex,
  input: CreateBookingInput,
  roomsService: RoomsService,
  excludeBookingId?: string
): Promise<ValidationResult> {
  const reasons: ConflictReport['reasons'] = [];

  const room = await roomsService.getRoomSummary(input.roomId);
  if (!room || room.status !== 'ACTIVE') {
    return { ok: false, reasons: ['ROOM_INACTIVE'] };
  }

  const startAt = parseISO(input.startAt);
  const endAt = parseISO(input.endAt);
  const now = new Date();

  // Duration checks
  if (!isAfter(startAt, now) || isBefore(endAt, startAt)) reasons.push('DURATION');
  else {
    const dur = differenceInMinutes(endAt, startAt);
    if (dur % 15 !== 0 || dur < room.minBookingMinutes || dur > room.maxBookingMinutes) reasons.push('DURATION');
  }

  // Capacity
  if (input.attendeeCount > room.capacity) reasons.push('CAPACITY');

  // Operating hours (in room timezone)
  const tz = room.timezone;
  const startZoned = toZonedTime(startAt, tz);
  const endZoned = toZonedTime(endAt, tz);
  const dayOfWeek = startZoned.getDay() === 0 ? 7 : startZoned.getDay(); // ISO: 1=Mon..7=Sun
  const [openH, openM] = room.openTime.split(':').map(Number);
  const [closeH, closeM] = room.closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const startMinutes = startZoned.getHours() * 60 + startZoned.getMinutes();
  const endMinutes = endZoned.getHours() * 60 + endZoned.getMinutes();
  const openDays: number[] = room.openDays;
  if (!openDays.includes(dayOfWeek) || startMinutes < openMinutes || endMinutes > closeMinutes) {
    reasons.push('OUTSIDE_HOURS');
  }

  // Equipment
  const requiredEquipment = input.requiredEquipment ?? [];
  for (const code of requiredEquipment) {
    const eq = room.equipment.find(e => e.code === code);
    if (!eq || eq.status !== 'WORKING') reasons.push('EQUIPMENT');
  }

  // Blackouts
  const blackouts = await db('room_blackouts')
    .where('room_id', input.roomId)
    .where('start_at', '<', endAt.toISOString().slice(0, 19).replace('T', ' '))
    .where('end_at', '>', startAt.toISOString().slice(0, 19).replace('T', ' '));
  if (blackouts.length > 0) reasons.push('BLACKOUT');

  // Conflict check with buffer
  const bufMin = room.bufferMinutes;
  const bufferedStart = addMinutes(startAt, -bufMin);
  const bufferedEnd = addMinutes(endAt, bufMin);
  const conflicts = await getBlockingBookings(db, input.roomId, bufferedStart, bufferedEnd, excludeBookingId);
  if (conflicts.length > 0) reasons.push('ROOM_BUSY');

  // Participant availability
  const participantEmails = input.participantEmails ?? [];
  if (participantEmails.length > 0) {
    const users = await db('users').whereIn('email', participantEmails).select('id', 'email');
    for (const user of users) {
      const participantConflict = await db('bookings')
        .where('client_id', user.id)
        .whereIn('status', ['CONFIRMED', 'CHECKED_IN', 'HELD'])
        .where('start_at', '<', endAt.toISOString().slice(0, 19).replace('T', ' '))
        .where('end_at', '>', startAt.toISOString().slice(0, 19).replace('T', ' '))
        .first();
      if (participantConflict) { reasons.push('PARTICIPANT_BUSY'); break; }
    }
  }

  return { ok: reasons.length === 0, reasons };
}

export async function findAlternatives(
  db: Knex,
  roomId: string,
  startAt: Date,
  endAt: Date,
  roomsService: RoomsService
): Promise<AlternativeSlot[]> {
  const room = await roomsService.getRoomSummary(roomId);
  if (!room) return [];
  const durationMs = endAt.getTime() - startAt.getTime();
  const alternatives: AlternativeSlot[] = [];

  // Check ±3h in 30-min steps
  for (let offset = -360; offset <= 360; offset += 30) {
    if (offset === 0) continue;
    const altStart = addMinutes(startAt, offset);
    const altEnd = addMinutes(endAt, offset);
    if (isAfter(new Date(), altStart)) continue;
    const conflicts = await getBlockingBookings(db, roomId, altStart, altEnd);
    if (conflicts.length === 0) {
      const direction = offset < 0 ? 'earlier' : 'later';
      const hours = Math.abs(Math.round(offset / 60));
      const mins = Math.abs(offset % 60);
      const label = hours > 0 ? `${hours}h${mins ? ` ${mins}min` : ''}` : `${mins}min`;
      alternatives.push({
        roomId,
        roomName: room.name,
        startAt: altStart.toISOString(),
        endAt: altEnd.toISOString(),
        matchScore: 80,
        reason: `Free ${label} ${direction}, same room`,
      });
      if (alternatives.length >= 6) break;
    }
  }
  return alternatives;
}

export function createBookingService(db: Knex, roomsService: () => RoomsService, notificationService: () => NotificationService, holdTtlSeconds: number): BookingService {
  return {
    async getBooking(id) {
      return getBookingWithParticipants(db, id);
    },

    async createHold(input, actor) {
      const rooms = roomsService();
      const validation = await validateBooking(db, input, rooms);

      if (!validation.ok) {
        const alts = await findAlternatives(db, input.roomId, parseISO(input.startAt), parseISO(input.endAt), rooms);
        throw new ApiError(409, 'SLOT_UNAVAILABLE', 'Slot unavailable', { reasons: validation.reasons, alternatives: alts });
      }

      // Check idempotency
      if (input.idempotencyKey) {
        const existing = await db('bookings')
          .where({ client_id: actor.userId, idempotency_key: input.idempotencyKey })
          .first();
        if (existing) return getBookingWithParticipants(db, existing.id) as Promise<BookingDto>;
      }

      const room = await rooms.getRoomSummary(input.roomId);
      const durationHours = differenceInMinutes(parseISO(input.endAt), parseISO(input.startAt)) / 60;
      const totalPrice = (room?.hourlyPrice ?? 0) * durationHours;
      const holdExpiresAt = addMinutes(new Date(), Math.round(holdTtlSeconds / 60));
      const id = uuid();

      // Concurrency-safe: lock room row then re-check
      await db.transaction(async trx => {
        if (db.client.config.client !== 'sqlite3') {
          await trx.raw('SELECT id FROM rooms WHERE id = ? FOR UPDATE', [input.roomId]);
        }
        const conflictsInTxn = await getBlockingBookings(trx, input.roomId, parseISO(input.startAt), parseISO(input.endAt));
        if (conflictsInTxn.length > 0) {
          throw new ApiError(409, 'SLOT_UNAVAILABLE', 'Slot taken (race condition)', { reasons: ['ROOM_BUSY'] as ConflictReport['reasons'], alternatives: [] });
        }
        await trx('bookings').insert({
          id,
          room_id: input.roomId,
          client_id: actor.userId,
          title: input.title,
          notes: input.notes ?? null,
          start_at: parseISO(input.startAt).toISOString().slice(0, 19).replace('T', ' '),
          end_at: parseISO(input.endAt).toISOString().slice(0, 19).replace('T', ' '),
          attendee_count: input.attendeeCount,
          required_equipment: JSON.stringify(input.requiredEquipment ?? []),
          status: 'HELD',
          hold_expires_at: holdExpiresAt.toISOString().slice(0, 19).replace('T', ' '),
          source: input.source ?? 'WEB',
          total_price: totalPrice,
          match_score: input.matchScore ?? null,
          match_reason: input.matchReason ?? null,
          idempotency_key: input.idempotencyKey ?? null,
        });
        await insertParticipants(trx, id, input.participantEmails ?? []);
      });

      return getBookingWithParticipants(db, id) as Promise<BookingDto>;
    },

    async confirm(bookingId, actor) {
      const booking = await db('bookings').where('id', bookingId).first();
      if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
      if (booking.client_id !== actor.userId) throw new ApiError(403, 'FORBIDDEN', 'Not your booking');
      if (booking.status !== 'HELD') throw new ApiError(409, 'CONFLICT', 'Booking not in HELD state');
      if (!booking.hold_expires_at || new Date(booking.hold_expires_at) < new Date()) {
        throw new ApiError(409, 'HOLD_EXPIRED', 'Hold has expired');
      }
      await db('bookings').where('id', bookingId).update({ status: 'CONFIRMED', hold_expires_at: null });

      // Notify
      try {
        const notifications = notificationService();
        await notifications.notify(actor.userId, { type: 'BOOKING_CONFIRMED', title: 'Booking confirmed', body: `Your booking "${booking.title}" is confirmed.` });
        const ownerId = await roomsService().getOwnerId(booking.room_id);
        if (ownerId) await notifications.notify(ownerId, { type: 'BOOKING_CONFIRMED', title: 'New booking', body: `New booking for room ${booking.room_id}: "${booking.title}"` });
      } catch {}

      return getBookingWithParticipants(db, bookingId) as Promise<BookingDto>;
    },

    async cancel(bookingId, actor, reason?) {
      const booking = await db('bookings').where('id', bookingId).first();
      if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
      if (booking.client_id !== actor.userId) throw new ApiError(403, 'FORBIDDEN', 'Not your booking');
      if (!['HELD', 'CONFIRMED'].includes(booking.status)) throw new ApiError(409, 'CONFLICT', 'Cannot cancel in current state');
      await db('bookings').where('id', bookingId).update({ status: 'CANCELLED', cancelled_at: new Date().toISOString().slice(0, 19).replace('T', ' '), cancel_reason: reason ?? null });
      return getBookingWithParticipants(db, bookingId) as Promise<BookingDto>;
    },

    async listMine(userId, scope) {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      let q = db('bookings').where('client_id', userId).orderBy('start_at', scope === 'past' ? 'desc' : 'asc');
      if (scope === 'upcoming') q = q.whereIn('status', ['HELD', 'CONFIRMED', 'CHECKED_IN']).where('end_at', '>', now);
      else if (scope === 'past') q = q.whereIn('status', ['COMPLETED', 'CHECKED_IN', 'NO_SHOW', 'RELEASED']).where('end_at', '<', now);
      else q = q.whereIn('status', ['CANCELLED', 'RELEASED']);
      const rows = await q;
      return Promise.all(rows.map(async (r: Record<string, unknown>) => {
        const parts = await db('booking_participants').where('booking_id', r['id'] as string).select('email', 'name', 'status');
        return rowToDto(r, parts);
      }));
    },

    async findCheckinCandidate(roomId, userId, at, openBeforeMin) {
      const windowStart = addMinutes(at, -openBeforeMin);
      const row = await db('bookings')
        .where({ room_id: roomId, client_id: userId, status: 'CONFIRMED' })
        .where('start_at', '>=', windowStart.toISOString().slice(0, 19).replace('T', ' '))
        .first();
      if (!row) return null;
      return rowToDto(row);
    },

    async markCheckedIn(bookingId, at) {
      await db('bookings').where('id', bookingId).update({ status: 'CHECKED_IN', checked_in_at: at.toISOString().slice(0, 19).replace('T', ' ') });
      return getBookingWithParticipants(db, bookingId) as Promise<BookingDto>;
    },

    async markReleased(bookingId, reason) {
      await db('bookings').where('id', bookingId).update({ status: 'RELEASED', cancel_reason: reason });
      return getBookingWithParticipants(db, bookingId) as Promise<BookingDto>;
    },

    async listDueForRelease(now) {
      const rows = await db('bookings')
        .join('rooms', 'rooms.id', 'bookings.room_id')
        .where('bookings.status', 'CONFIRMED')
        .whereNull('bookings.checked_in_at')
        .where(db.raw('DATE_ADD(bookings.start_at, INTERVAL rooms.checkin_grace_minutes MINUTE) < ?', [now.toISOString().slice(0, 19).replace('T', ' ')]))
        .select('bookings.*');
      return rows.map((r: Record<string, unknown>) => rowToDto(r));
    },
  };
}

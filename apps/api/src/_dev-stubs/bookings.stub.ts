import type { BookingService, BookingDto, CreateBookingInput, ModuleContext } from '@meetmaze/shared/contracts';
import { ApiError, generateId } from '@meetmaze/shared/core';
import { SEED_IDS } from '@meetmaze/shared/domain';
import { addMinutes, addHours } from 'date-fns';

// In-memory bookings store for stub
const bookings: BookingDto[] = [];

function createDemoBooking(): void {
  const now = new Date();
  const startAt = addMinutes(now, 5);
  const endAt = addHours(startAt, 1);

  bookings.push({
    id: 'd0000000-0000-4000-8000-000000000001',
    roomId: SEED_IDS.rooms.aurora,
    clientId: SEED_IDS.users.client,
    title: 'Sprint Planning',
    notes: 'Weekly sprint planning meeting',
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    attendeeCount: 8,
    requiredEquipment: ['PROJECTOR', 'WHITEBOARD'],
    status: 'CONFIRMED',
    holdExpiresAt: null,
    checkedInAt: null,
    source: 'WEB',
    totalPrice: 1800,
    matchScore: 92,
    matchReason: 'Great match: capacity, equipment, and availability all fit perfectly',
    participants: [
      { email: 'client@meetmaze.dev', name: 'Rahul Mehta', status: 'ACCEPTED' },
      { email: 'priya@meetmaze.dev', name: 'Priya Sharma', status: 'INVITED' },
    ],
    createdAt: new Date().toISOString(),
  });

  // A completed booking for review testing
  const pastStart = addHours(now, -3);
  const pastEnd = addHours(now, -2);
  bookings.push({
    id: 'd0000000-0000-4000-8000-000000000002',
    roomId: SEED_IDS.rooms.ideation,
    clientId: SEED_IDS.users.client,
    title: 'Design Review',
    notes: null,
    startAt: pastStart.toISOString(),
    endAt: pastEnd.toISOString(),
    attendeeCount: 5,
    requiredEquipment: ['WHITEBOARD'],
    status: 'COMPLETED',
    holdExpiresAt: null,
    checkedInAt: pastStart.toISOString(),
    source: 'WEB',
    totalPrice: 1100,
    matchScore: 85,
    matchReason: 'Good match for creative sessions',
    participants: [{ email: 'client@meetmaze.dev', name: 'Rahul Mehta', status: 'ACCEPTED' }],
    createdAt: pastStart.toISOString(),
  });

  // Another completed booking for Atlas Room (to test issue + review)
  const pastStart2 = addHours(now, -5);
  const pastEnd2 = addHours(now, -4);
  bookings.push({
    id: 'd0000000-0000-4000-8000-000000000003',
    roomId: SEED_IDS.rooms.atlas,
    clientId: SEED_IDS.users.client,
    title: 'Client Presentation',
    notes: null,
    startAt: pastStart2.toISOString(),
    endAt: pastEnd2.toISOString(),
    attendeeCount: 8,
    requiredEquipment: ['PROJECTOR'],
    status: 'COMPLETED',
    holdExpiresAt: null,
    checkedInAt: pastStart2.toISOString(),
    source: 'WEB',
    totalPrice: 1400,
    matchScore: 78,
    matchReason: 'Projector is faulty — consider alternatives',
    participants: [{ email: 'client@meetmaze.dev', name: 'Rahul Mehta', status: 'ACCEPTED' }],
    createdAt: pastStart2.toISOString(),
  });
}

export function createStub(ctx: ModuleContext): BookingService {
  const logger = ctx.logger as any;
  createDemoBooking();

  return {
    async getBooking(id: string): Promise<BookingDto | null> {
      logger.info(`[STUB] bookings.getBooking(${id})`);
      return bookings.find(b => b.id === id) ?? null;
    },

    async createHold(input: CreateBookingInput, actor: { userId: string }): Promise<BookingDto> {
      logger.info(`[STUB] bookings.createHold(${input.roomId})`);
      const id = generateId();
      const holdExpiresAt = addMinutes(new Date(), 5).toISOString();
      const durationHours = (new Date(input.endAt).getTime() - new Date(input.startAt).getTime()) / 3600000;
      const booking: BookingDto = {
        id, roomId: input.roomId, clientId: actor.userId, title: input.title, notes: input.notes ?? null,
        startAt: input.startAt, endAt: input.endAt, attendeeCount: input.attendeeCount,
        requiredEquipment: input.requiredEquipment ?? [], status: 'HELD', holdExpiresAt, checkedInAt: null,
        source: input.source ?? 'WEB', totalPrice: Math.round(durationHours * 1000 * 100) / 100,
        matchScore: input.matchScore ?? null, matchReason: input.matchReason ?? null,
        participants: (input.participantEmails ?? []).map(e => ({ email: e, status: 'INVITED' })),
        createdAt: new Date().toISOString(),
      };
      bookings.push(booking);
      return booking;
    },

    async confirm(bookingId: string, actor: { userId: string }): Promise<BookingDto> {
      logger.info(`[STUB] bookings.confirm(${bookingId})`);
      const b = bookings.find(x => x.id === bookingId);
      if (!b) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
      if (b.status !== 'HELD') throw new ApiError(409, 'HOLD_EXPIRED', 'Booking is not in HELD status');
      b.status = 'CONFIRMED';
      b.holdExpiresAt = null;
      return b;
    },

    async cancel(bookingId: string, actor: { userId: string }, reason?: string): Promise<BookingDto> {
      logger.info(`[STUB] bookings.cancel(${bookingId})`);
      const b = bookings.find(x => x.id === bookingId);
      if (!b) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
      b.status = 'CANCELLED';
      return b;
    },

    async listMine(userId: string, scope: 'upcoming' | 'past' | 'cancelled'): Promise<BookingDto[]> {
      logger.info(`[STUB] bookings.listMine(${userId}, ${scope})`);
      const now = new Date();
      return bookings.filter(b => {
        if (b.clientId !== userId) return false;
        if (scope === 'upcoming') return new Date(b.startAt) > now && !['CANCELLED', 'RELEASED'].includes(b.status);
        if (scope === 'past') return new Date(b.endAt) < now || ['COMPLETED', 'CHECKED_IN', 'RELEASED', 'NO_SHOW'].includes(b.status);
        if (scope === 'cancelled') return b.status === 'CANCELLED';
        return true;
      });
    },

    async findCheckinCandidate(roomId: string, userId: string, at: Date, openBeforeMin: number): Promise<BookingDto | null> {
      logger.info(`[STUB] bookings.findCheckinCandidate(${roomId}, ${userId})`);
      return bookings.find(b =>
        b.roomId === roomId && b.clientId === userId && b.status === 'CONFIRMED' &&
        new Date(b.startAt).getTime() - openBeforeMin * 60000 <= at.getTime() &&
        at.getTime() <= new Date(b.startAt).getTime() + 15 * 60000,
      ) ?? null;
    },

    async markCheckedIn(bookingId: string, at: Date): Promise<BookingDto> {
      logger.info(`[STUB] bookings.markCheckedIn(${bookingId})`);
      const b = bookings.find(x => x.id === bookingId);
      if (!b) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
      b.status = 'CHECKED_IN';
      b.checkedInAt = at.toISOString();
      return b;
    },

    async markReleased(bookingId: string, reason: string): Promise<BookingDto> {
      logger.info(`[STUB] bookings.markReleased(${bookingId})`);
      const b = bookings.find(x => x.id === bookingId);
      if (!b) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
      b.status = 'RELEASED';
      return b;
    },

    async listDueForRelease(now: Date): Promise<BookingDto[]> {
      logger.info(`[STUB] bookings.listDueForRelease`);
      return bookings.filter(b =>
        b.status === 'CONFIRMED' &&
        new Date(b.startAt).getTime() + 15 * 60000 < now.getTime(),
      );
    },
  };
}

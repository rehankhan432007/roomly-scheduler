// Bookings service stub
import type { BookingService, BookingDto, CreateBookingInput, ModuleContext } from '@meetmaze/shared/contracts';
import { v4 as uuid } from 'uuid';

export function createBookingsStub(ctx: ModuleContext): BookingService {
  const log = ctx.logger;
  const mkBooking = (input: Partial<BookingDto> = {}): BookingDto => ({
    id: uuid(), roomId: input.roomId ?? uuid(), clientId: input.clientId ?? uuid(),
    title: input.title ?? 'Stub Booking', startAt: input.startAt ?? new Date().toISOString(),
    endAt: input.endAt ?? new Date(Date.now() + 3600000).toISOString(),
    attendeeCount: input.attendeeCount ?? 4, requiredEquipment: [],
    status: input.status ?? 'CONFIRMED', source: 'WEB', totalPrice: 1000,
    participants: [], createdAt: new Date().toISOString(), ...input,
  });

  return {
    async getBooking(id) { log.info(`[STUB] bookings.getBooking(${id})`); return mkBooking({ id }); },
    async createHold(input, actor) { log.info(`[STUB] bookings.createHold`); return mkBooking({ ...input, clientId: actor.userId, status: 'HELD', holdExpiresAt: new Date(Date.now() + 300000).toISOString() }); },
    async confirm(bookingId, actor) { log.info(`[STUB] bookings.confirm(${bookingId})`); return mkBooking({ id: bookingId, status: 'CONFIRMED' }); },
    async cancel(bookingId, actor, reason) { log.info(`[STUB] bookings.cancel(${bookingId})`); return mkBooking({ id: bookingId, status: 'CANCELLED' }); },
    async listMine(userId, scope) { log.info(`[STUB] bookings.listMine(${userId}, ${scope})`); return [mkBooking({ clientId: userId })]; },
    async findCheckinCandidate(roomId, userId, at, openBeforeMin) { log.info(`[STUB] bookings.findCheckinCandidate`); return mkBooking({ roomId, clientId: userId }); },
    async markCheckedIn(bookingId, at) { log.info(`[STUB] bookings.markCheckedIn(${bookingId})`); return mkBooking({ id: bookingId, status: 'CHECKED_IN' }); },
    async markReleased(bookingId, reason) { log.info(`[STUB] bookings.markReleased(${bookingId})`); return mkBooking({ id: bookingId, status: 'RELEASED' }); },
    async listDueForRelease(now) { log.info(`[STUB] bookings.listDueForRelease`); return []; },
  };
}

import type { ApiModule, ModuleContext } from '@meetmaze/shared/contracts';
import { ApiError } from '@meetmaze/shared/core';
import { CheckinScanInput } from '@meetmaze/shared/modules/experience';
import { requireAuth, optionalAuth, validate, ok } from '../../core/middleware.js';
import { config } from '../../core/config.js';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

type CheckinState = 'NO_BOOKING' | 'TOO_EARLY' | 'OPEN' | 'ALREADY_CHECKED_IN' | 'WINDOW_CLOSED' | 'RELEASED' | 'INVALID_TOKEN';

function resolveCheckinState(
  booking: { startAt: string; endAt: string; status: string; checkedInAt?: string | null } | null,
  room: { checkinGraceMinutes: number } | null,
  now: Date,
  openBeforeMin: number,
): CheckinState {
  if (!booking) return 'NO_BOOKING';
  if (booking.status === 'CHECKED_IN') return 'ALREADY_CHECKED_IN';
  if (booking.status === 'RELEASED') return 'RELEASED';
  if (!['CONFIRMED', 'HELD'].includes(booking.status)) return 'WINDOW_CLOSED';

  const start = new Date(booking.startAt);
  const graceMin = room?.checkinGraceMinutes ?? 15;
  const opensAt = new Date(start.getTime() - openBeforeMin * 60000);
  const closesAt = new Date(start.getTime() + graceMin * 60000);

  if (now < opensAt) return 'TOO_EARLY';
  if (now > closesAt) return 'WINDOW_CLOSED';
  return 'OPEN';
}

function formatTimeInZone(date: Date, tz: string): string {
  const zonedDate = toZonedTime(date, tz);
  return format(zonedDate, 'h:mm a');
}

const checkinModule: ApiModule = {
  name: 'checkin',
  part: 4,
  requires: ['rooms', 'bookings', 'notifications', 'ranking'],

  async register(ctx: ModuleContext): Promise<void> {
    const { router, db } = ctx;
    const logger = ctx.logger as any;
    const rooms = () => ctx.services.get('rooms');
    const bookingsService = () => ctx.services.get('bookings');
    const notifications = () => ctx.services.get('notifications');
    const ranking = () => ctx.services.get('ranking');

    // GET /checkin/resolve/:token
    router.get('/checkin/resolve/:token', optionalAuth, async (req, res, next) => {
      try {
        const token = req.params.token;
        const room = await rooms().resolveRoomByQrToken(token);
        if (!room) {
          ok(res, { room: null, window: null, state: 'INVALID_TOKEN' as CheckinState, booking: undefined });
          return;
        }

        const now = new Date();
        const openBeforeMin = config.checkinOpenBeforeMin;
        let booking = null;
        let state: CheckinState = 'NO_BOOKING';

        if (req.user) {
          booking = await bookingsService().findCheckinCandidate(room.id, req.user.sub, now, openBeforeMin);
          state = resolveCheckinState(
            booking ? { startAt: booking.startAt, endAt: booking.endAt, status: booking.status, checkedInAt: booking.checkedInAt } : null,
            { checkinGraceMinutes: room.checkinGraceMinutes },
            now, openBeforeMin,
          );
        }

        const start = booking ? new Date(booking.startAt) : now;
        const graceMin = room.checkinGraceMinutes;
        const opensAt = new Date(start.getTime() - openBeforeMin * 60000).toISOString();
        const closesAt = new Date(start.getTime() + graceMin * 60000).toISOString();

        ok(res, {
          room: { name: room.name, location: room.locationName, floor: room.floor ?? null },
          window: { opensAt, closesAt },
          state,
          booking: booking && req.user?.sub === booking.clientId ? {
            id: booking.id, title: booking.title,
            startAt: booking.startAt, endAt: booking.endAt, status: booking.status,
          } : undefined,
        });
      } catch (e) { next(e); }
    });

    // POST /checkin/scan
    router.post('/checkin/scan', requireAuth, validate({ body: CheckinScanInput }), async (req, res, next) => {
      try {
        const userId = req.user!.sub;
        const { token } = req.body;

        const room = await rooms().resolveRoomByQrToken(token);
        if (!room) throw new ApiError(404, 'NOT_FOUND', 'Invalid QR code');

        const now = new Date();
        const openBeforeMin = config.checkinOpenBeforeMin;
        const booking = await bookingsService().findCheckinCandidate(room.id, userId, now, openBeforeMin);

        if (!booking) throw new ApiError(404, 'NOT_FOUND', 'No booking found for this room');

        const state = resolveCheckinState(
          { startAt: booking.startAt, endAt: booking.endAt, status: booking.status, checkedInAt: booking.checkedInAt },
          { checkinGraceMinutes: room.checkinGraceMinutes },
          now, openBeforeMin,
        );

        const tz = room.timezone || 'Asia/Kolkata';
        const start = new Date(booking.startAt);
        const graceMin = room.checkinGraceMinutes;

        switch (state) {
          case 'TOO_EARLY': {
            const opensAt = new Date(start.getTime() - openBeforeMin * 60000);
            throw new ApiError(400, 'CHECKIN_WINDOW', `Too early — check-in opens at ${formatTimeInZone(opensAt, tz)}`);
          }
          case 'WINDOW_CLOSED': {
            const closesAt = new Date(start.getTime() + graceMin * 60000);
            throw new ApiError(400, 'CHECKIN_WINDOW', `Check-in window closed at ${formatTimeInZone(closesAt, tz)}`);
          }
          case 'RELEASED':
            throw new ApiError(400, 'CHECKIN_WINDOW', 'This booking was released because nobody checked in on time');
          case 'ALREADY_CHECKED_IN':
            throw new ApiError(409, 'CONFLICT', 'Already checked in');
          case 'NO_BOOKING':
            throw new ApiError(404, 'NOT_FOUND', 'No booking found for this room');
          case 'OPEN': {
            const updatedBooking = await bookingsService().markCheckedIn(booking.id, now);
            ok(res, {
              message: 'Checked in successfully! Enjoy your meeting.',
              booking: updatedBooking,
              room: { name: room.name, location: room.locationName, floor: room.floor },
            });
            return;
          }
          default:
            throw new ApiError(500, 'INTERNAL', 'Unknown check-in state');
        }
      } catch (e) { next(e); }
    });
  },

  jobs: [
    {
      name: 'auto-release',
      intervalMs: 30 * 1000,
      run: async (ctx: ModuleContext): Promise<void> => {
        const logger = ctx.logger as any;
        const bookingsService = ctx.services.get('bookings');
        const notifications = ctx.services.get('notifications');
        const ranking = ctx.services.get('ranking');
        const roomsService = ctx.services.get('rooms');

        try {
          const now = new Date();
          const due = await bookingsService.listDueForRelease(now);

          for (const booking of due) {
            try {
              await bookingsService.markReleased(booking.id, 'no check-in');

              // Notify client
              const room = await roomsService.getRoomSummary(booking.roomId);
              const roomName = room?.name ?? 'the room';
              await notifications.notify(booking.clientId, {
                type: 'BOOKING_RELEASED',
                title: `${roomName} released`,
                body: `We released ${roomName} because no one checked in on time.`,
                data: { bookingId: booking.id, roomId: booking.roomId },
              });

              // Notify owner
              const ownerId = await roomsService.getOwnerId(booking.roomId);
              if (ownerId) {
                await notifications.notify(ownerId, {
                  type: 'BOOKING_RELEASED',
                  title: `${roomName} auto-released`,
                  body: `Booking "${booking.title}" was released (no check-in).`,
                  data: { bookingId: booking.id, roomId: booking.roomId },
                });
              }

              await ranking.recomputeRoom(booking.roomId);
              logger.info({ bookingId: booking.id }, 'Auto-released booking');
            } catch (err) {
              logger.error({ err, bookingId: booking.id }, 'Failed to auto-release booking');
            }
          }
        } catch (err) {
          logger.error({ err }, 'auto-release job failed');
        }
      },
    },
  ],
};

export { resolveCheckinState };
export default checkinModule;

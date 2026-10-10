// Rooms service stub
import type { RoomsService, RoomSummary, ModuleContext } from '@meetmaze/shared/contracts';
import { SEED_IDS } from '@meetmaze/shared/domain';

export function createRoomsStub(ctx: ModuleContext): RoomsService {
  const log = ctx.logger;

  const stubRoom = (id: string, name: string, locName: string, capacity: number): RoomSummary => ({
    id, name, locationId: SEED_IDS.locations.indiranagar, locationName: locName,
    city: 'Bengaluru', timezone: 'Asia/Kolkata', floor: '1', capacity,
    roomType: 'MEETING', vibe: 'FORMAL', hourlyPrice: 1000, currency: 'INR',
    photos: [], status: 'ACTIVE', openTime: '09:00:00', closeTime: '19:00:00',
    openDays: [1, 2, 3, 4, 5], minBookingMinutes: 30, maxBookingMinutes: 480,
    bufferMinutes: 0, checkinGraceMinutes: 15, equipment: [],
    avgRating: null, reviewCount: 0,
  });

  return {
    async getRoomSummary(roomId) {
      log.info(`[STUB] rooms.getRoomSummary(${roomId})`);
      return stubRoom(roomId, 'Stub Room', 'Stub Location', 10);
    },
    async getRoomSummaries(roomIds) {
      log.info(`[STUB] rooms.getRoomSummaries(${roomIds.length} rooms)`);
      return roomIds.map((id) => stubRoom(id, 'Stub Room', 'Stub Location', 10));
    },
    async resolveRoomByQrToken(token) {
      log.info(`[STUB] rooms.resolveRoomByQrToken(${token})`);
      return stubRoom(SEED_IDS.rooms.aurora, 'Aurora Boardroom', 'Indiranagar Hub', 12);
    },
    async getOwnerId(roomId) {
      log.info(`[STUB] rooms.getOwnerId(${roomId})`);
      return SEED_IDS.users.owner;
    },
    async flagEquipment(roomId, code, reason) {
      log.info(`[STUB] rooms.flagEquipment(${roomId}, ${code}, ${reason})`);
    },
    async clearEquipmentFlag(roomId, code) {
      log.info(`[STUB] rooms.clearEquipmentFlag(${roomId}, ${code})`);
    },
  };
}

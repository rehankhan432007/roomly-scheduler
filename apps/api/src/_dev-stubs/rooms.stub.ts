import type { RoomsService, RoomSummary, ModuleContext } from '@meetmaze/shared/contracts';
import { SEED_IDS } from '@meetmaze/shared/domain';

const seedRooms: RoomSummary[] = [
  {
    id: SEED_IDS.rooms.aurora, name: 'Aurora Boardroom', locationId: SEED_IDS.locations.indiranagar,
    locationName: 'Indiranagar Hub', city: 'Bengaluru', timezone: 'Asia/Kolkata', floor: '3',
    capacity: 12, roomType: 'BOARDROOM', vibe: 'FORMAL', hourlyPrice: 1800, currency: 'INR',
    photos: [], status: 'ACTIVE', openTime: '09:00:00', closeTime: '19:00:00', openDays: [1,2,3,4,5],
    minBookingMinutes: 30, maxBookingMinutes: 480, bufferMinutes: 0, checkinGraceMinutes: 15,
    equipment: [
      { code: 'PROJECTOR', name: 'Projector', icon: 'Projector', quantity: 1, status: 'WORKING' },
      { code: 'VIDEO_CONFERENCING', name: 'Video Conferencing', icon: 'Video', quantity: 1, status: 'WORKING' },
      { code: 'WHITEBOARD', name: 'Whiteboard', icon: 'PenSquare', quantity: 1, status: 'WORKING' },
      { code: 'AIR_CONDITIONING', name: 'Air Conditioning', icon: 'Snowflake', quantity: 1, status: 'WORKING' },
      { code: 'POWER_STRIPS', name: 'Power Strips', icon: 'Plug', quantity: 1, status: 'WORKING' },
    ],
    avgRating: 8.5, reviewCount: 12,
  },
  {
    id: SEED_IDS.rooms.spark, name: 'Spark Huddle', locationId: SEED_IDS.locations.indiranagar,
    locationName: 'Indiranagar Hub', city: 'Bengaluru', timezone: 'Asia/Kolkata', floor: '2',
    capacity: 4, roomType: 'HUDDLE', vibe: 'CASUAL', hourlyPrice: 500, currency: 'INR',
    photos: [], status: 'ACTIVE', openTime: '09:00:00', closeTime: '19:00:00', openDays: [1,2,3,4,5],
    minBookingMinutes: 30, maxBookingMinutes: 480, bufferMinutes: 0, checkinGraceMinutes: 15,
    equipment: [
      { code: 'TV_SCREEN', name: 'TV / Display Screen', icon: 'Tv', quantity: 1, status: 'WORKING' },
      { code: 'WHITEBOARD', name: 'Whiteboard', icon: 'PenSquare', quantity: 1, status: 'WORKING' },
      { code: 'WIRELESS_CASTING', name: 'Wireless Casting', icon: 'Cast', quantity: 1, status: 'WORKING' },
    ],
    avgRating: 7.2, reviewCount: 5,
  },
  {
    id: SEED_IDS.rooms.zen, name: 'Zen Pod', locationId: SEED_IDS.locations.indiranagar,
    locationName: 'Indiranagar Hub', city: 'Bengaluru', timezone: 'Asia/Kolkata', floor: '1',
    capacity: 2, roomType: 'PHONE_BOOTH', vibe: 'QUIET', hourlyPrice: 250, currency: 'INR',
    photos: [], status: 'ACTIVE', openTime: '09:00:00', closeTime: '19:00:00', openDays: [1,2,3,4,5],
    minBookingMinutes: 30, maxBookingMinutes: 480, bufferMinutes: 0, checkinGraceMinutes: 10,
    equipment: [
      { code: 'SPEAKERPHONE', name: 'Speakerphone', icon: 'Phone', quantity: 1, status: 'WORKING' },
      { code: 'POWER_STRIPS', name: 'Power Strips', icon: 'Plug', quantity: 1, status: 'WORKING' },
    ],
    avgRating: 9.0, reviewCount: 3,
  },
  {
    id: SEED_IDS.rooms.summit, name: 'Summit Hall', locationId: SEED_IDS.locations.koramangala,
    locationName: 'Koramangala Tower', city: 'Bengaluru', timezone: 'Asia/Kolkata', floor: '5',
    capacity: 20, roomType: 'TRAINING', vibe: 'PRESENTATION', hourlyPrice: 2600, currency: 'INR',
    photos: [], status: 'ACTIVE', openTime: '09:00:00', closeTime: '19:00:00', openDays: [1,2,3,4,5],
    minBookingMinutes: 30, maxBookingMinutes: 480, bufferMinutes: 0, checkinGraceMinutes: 15,
    equipment: [
      { code: 'PROJECTOR', name: 'Projector', icon: 'Projector', quantity: 1, status: 'WORKING' },
      { code: 'MICROPHONE', name: 'Microphone', icon: 'Mic', quantity: 1, status: 'WORKING' },
      { code: 'VIDEO_CONFERENCING', name: 'Video Conferencing', icon: 'Video', quantity: 1, status: 'WORKING' },
      { code: 'AIR_CONDITIONING', name: 'Air Conditioning', icon: 'Snowflake', quantity: 1, status: 'WORKING' },
      { code: 'ACCESSIBLE', name: 'Wheelchair Accessible', icon: 'Accessibility', quantity: 1, status: 'WORKING' },
    ],
    avgRating: 8.0, reviewCount: 8,
  },
  {
    id: SEED_IDS.rooms.ideation, name: 'Ideation Studio', locationId: SEED_IDS.locations.koramangala,
    locationName: 'Koramangala Tower', city: 'Bengaluru', timezone: 'Asia/Kolkata', floor: '3',
    capacity: 8, roomType: 'MEETING', vibe: 'CREATIVE', hourlyPrice: 1100, currency: 'INR',
    photos: [], status: 'ACTIVE', openTime: '09:00:00', closeTime: '19:00:00', openDays: [1,2,3,4,5],
    minBookingMinutes: 30, maxBookingMinutes: 480, bufferMinutes: 0, checkinGraceMinutes: 15,
    equipment: [
      { code: 'WHITEBOARD', name: 'Whiteboard', icon: 'PenSquare', quantity: 1, status: 'WORKING' },
      { code: 'TV_SCREEN', name: 'TV / Display Screen', icon: 'Tv', quantity: 1, status: 'WORKING' },
      { code: 'HDMI_ADAPTER', name: 'HDMI / Adapters', icon: 'Cable', quantity: 1, status: 'WORKING' },
      { code: 'POWER_STRIPS', name: 'Power Strips', icon: 'Plug', quantity: 1, status: 'WORKING' },
    ],
    avgRating: 7.8, reviewCount: 6,
  },
  {
    id: SEED_IDS.rooms.atlas, name: 'Atlas Room', locationId: SEED_IDS.locations.koramangala,
    locationName: 'Koramangala Tower', city: 'Bengaluru', timezone: 'Asia/Kolkata', floor: '4',
    capacity: 10, roomType: 'MEETING', vibe: 'FORMAL', hourlyPrice: 1400, currency: 'INR',
    photos: [], status: 'ACTIVE', openTime: '09:00:00', closeTime: '19:00:00', openDays: [1,2,3,4,5],
    minBookingMinutes: 30, maxBookingMinutes: 480, bufferMinutes: 0, checkinGraceMinutes: 15,
    equipment: [
      { code: 'PROJECTOR', name: 'Projector', icon: 'Projector', quantity: 1, status: 'FAULTY' },
      { code: 'WHITEBOARD', name: 'Whiteboard', icon: 'PenSquare', quantity: 1, status: 'WORKING' },
      { code: 'VIDEO_CONFERENCING', name: 'Video Conferencing', icon: 'Video', quantity: 1, status: 'WORKING' },
    ],
    avgRating: 6.5, reviewCount: 10,
  },
];

const qrTokenMap: Record<string, string> = {
  [SEED_IDS.rooms.aurora]: 'qr-aurora-token-001',
  [SEED_IDS.rooms.spark]: 'qr-spark-token-002',
  [SEED_IDS.rooms.zen]: 'qr-zen-token-003',
  [SEED_IDS.rooms.summit]: 'qr-summit-token-004',
  [SEED_IDS.rooms.ideation]: 'qr-ideation-token-005',
  [SEED_IDS.rooms.atlas]: 'qr-atlas-token-006',
};

const tokenToRoom: Record<string, string> = {};
for (const [roomId, token] of Object.entries(qrTokenMap)) {
  tokenToRoom[token] = roomId;
}

export function createStub(_ctx: ModuleContext): RoomsService {
  const logger = _ctx.logger as any;

  return {
    async getRoomSummary(roomId: string): Promise<RoomSummary | null> {
      logger.info(`[STUB] rooms.getRoomSummary(${roomId})`);
      return seedRooms.find(r => r.id === roomId) ?? null;
    },
    async getRoomSummaries(roomIds: string[]): Promise<RoomSummary[]> {
      logger.info(`[STUB] rooms.getRoomSummaries(${roomIds.length} ids)`);
      return seedRooms.filter(r => roomIds.includes(r.id));
    },
    async resolveRoomByQrToken(token: string): Promise<RoomSummary | null> {
      logger.info(`[STUB] rooms.resolveRoomByQrToken(${token})`);
      const roomId = tokenToRoom[token];
      if (!roomId) return null;
      return seedRooms.find(r => r.id === roomId) ?? null;
    },
    async getOwnerId(roomId: string): Promise<string | null> {
      logger.info(`[STUB] rooms.getOwnerId(${roomId})`);
      const room = seedRooms.find(r => r.id === roomId);
      return room ? SEED_IDS.users.owner : null;
    },
    async flagEquipment(roomId: string, equipmentCode: string, reason: string): Promise<void> {
      logger.info(`[STUB] rooms.flagEquipment(${roomId}, ${equipmentCode}, ${reason})`);
      const room = seedRooms.find(r => r.id === roomId);
      if (room) {
        const eq = room.equipment.find(e => e.code === equipmentCode);
        if (eq) eq.status = 'FAULTY';
      }
    },
    async clearEquipmentFlag(roomId: string, equipmentCode: string): Promise<void> {
      logger.info(`[STUB] rooms.clearEquipmentFlag(${roomId}, ${equipmentCode})`);
      const room = seedRooms.find(r => r.id === roomId);
      if (room) {
        const eq = room.equipment.find(e => e.code === equipmentCode);
        if (eq) eq.status = 'WORKING';
      }
    },
  };
}

export { seedRooms, qrTokenMap };

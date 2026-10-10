import type {
  RoomSummary,
  BookingDto,
  CreateBookingInput,
  SearchCriteria,
  SearchResponse,
  SlotDto,
  BusyWarning,
  RoomSignals,
  NotificationInput,
  Iso,
} from './dtos.js';

export interface RoomsService {
  getRoomSummary(roomId: string): Promise<RoomSummary | null>;
  getRoomSummaries(roomIds: string[]): Promise<RoomSummary[]>;
  resolveRoomByQrToken(token: string): Promise<RoomSummary | null>;
  getOwnerId(roomId: string): Promise<string | null>;
  flagEquipment(roomId: string, equipmentCode: string, reason: string): Promise<void>;
  clearEquipmentFlag(roomId: string, equipmentCode: string): Promise<void>;
}

export interface BookingService {
  getBooking(id: string): Promise<BookingDto | null>;
  createHold(input: CreateBookingInput, actor: { userId: string }): Promise<BookingDto>;
  confirm(bookingId: string, actor: { userId: string }): Promise<BookingDto>;
  cancel(bookingId: string, actor: { userId: string }, reason?: string): Promise<BookingDto>;
  listMine(userId: string, scope: 'upcoming' | 'past' | 'cancelled'): Promise<BookingDto[]>;
  findCheckinCandidate(roomId: string, userId: string, at: Date, openBeforeMin: number): Promise<BookingDto | null>;
  markCheckedIn(bookingId: string, at: Date): Promise<BookingDto>;
  markReleased(bookingId: string, reason: string): Promise<BookingDto>;
  listDueForRelease(now: Date): Promise<BookingDto[]>;
}

export interface SearchService {
  searchRooms(criteria: SearchCriteria, actor?: { userId: string }): Promise<SearchResponse>;
  getAvailability(roomId: string, dateIso: string): Promise<SlotDto[]>;
}

export interface InsightsService {
  getBusyWarning(q: { locationId?: string; roomId?: string; startAt: Iso; endAt: Iso }): Promise<BusyWarning | null>;
  recompute(): Promise<void>;
}

export interface RankingService {
  getSignals(roomIds: string[]): Promise<Record<string, RoomSignals>>;
  recomputeRoom(roomId: string): Promise<void>;
}

export interface NotificationService {
  notify(userId: string, n: NotificationInput): Promise<void>;
}

export interface ServiceMap {
  rooms: RoomsService;
  bookings: BookingService;
  search: SearchService;
  insights: InsightsService;
  ranking: RankingService;
  notifications: NotificationService;
}

export const SERVICE_PROVIDER_PART: Record<keyof ServiceMap, 2 | 3 | 4> = {
  rooms: 2,
  bookings: 3,
  search: 3,
  insights: 4,
  ranking: 4,
  notifications: 4,
};

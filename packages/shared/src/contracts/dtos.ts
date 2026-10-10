// Shared DTOs and service contracts — verbatim from B8

export type Iso = string;

export interface RoomSummary {
  id: string;
  name: string;
  locationId: string;
  locationName: string;
  city: string;
  timezone: string;
  floor?: string | null;
  capacity: number;
  roomType: string;
  vibe: string;
  hourlyPrice: number;
  currency: string;
  photos: string[];
  status: string;
  openTime: string;
  closeTime: string;
  openDays: number[];
  minBookingMinutes: number;
  maxBookingMinutes: number;
  bufferMinutes: number;
  checkinGraceMinutes: number;
  equipment: {
    code: string;
    name: string;
    icon: string;
    quantity: number;
    status: 'WORKING' | 'FAULTY' | 'MAINTENANCE';
  }[];
  avgRating: number | null;
  reviewCount: number;
}

export interface BookingDto {
  id: string;
  roomId: string;
  room?: RoomSummary;
  clientId: string;
  title: string;
  notes?: string | null;
  startAt: Iso;
  endAt: Iso;
  attendeeCount: number;
  requiredEquipment: string[];
  status: 'HELD' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RELEASED';
  holdExpiresAt?: Iso | null;
  checkedInAt?: Iso | null;
  source: 'WEB' | 'ROOMBOT';
  totalPrice: number;
  matchScore?: number | null;
  matchReason?: string | null;
  participants: { email: string; name?: string | null; status: string }[];
  createdAt: Iso;
}

export interface CreateBookingInput {
  roomId: string;
  title: string;
  notes?: string;
  startAt: Iso;
  endAt: Iso;
  attendeeCount: number;
  requiredEquipment?: string[];
  participantEmails?: string[];
  source?: 'WEB' | 'ROOMBOT';
  matchScore?: number;
  matchReason?: string;
  idempotencyKey?: string;
}

export interface SearchCriteria {
  startAt: Iso;
  endAt: Iso;
  attendeeCount: number;
  requiredEquipment?: string[];
  locationId?: string;
  city?: string;
  vibe?: string;
  maxHourlyPrice?: number;
  participantEmails?: string[];
  limit?: number;
}

export interface MatchBreakdown {
  capacity: number;
  equipment: number;
  availability: number;
  rating: number;
  price: number;
  vibe: number;
}

export interface RoomMatch {
  room: RoomSummary;
  matchScore: number;
  matchReason: string;
  breakdown: MatchBreakdown;
  availability: 'FREE' | 'CONFLICT';
  missingEquipment: string[];
  faultyEquipment: string[];
  warnings: string[];
}

export interface BusyWarning {
  level: 'INFO' | 'WARN';
  message: string;
  fillRate: number;
  suggestedSlot?: { startAt: Iso; endAt: Iso };
}

export interface AlternativeSlot {
  roomId: string;
  roomName: string;
  startAt: Iso;
  endAt: Iso;
  matchScore: number;
  reason: string;
}

export interface SearchResponse {
  matches: RoomMatch[];
  alternatives: AlternativeSlot[];
  busyWarning: BusyWarning | null;
  participantConflicts: { email: string; startAt: Iso; endAt: Iso }[];
}

export interface ConflictReport {
  ok: boolean;
  reasons: (
    | 'ROOM_BUSY'
    | 'BLACKOUT'
    | 'OUTSIDE_HOURS'
    | 'DURATION'
    | 'CAPACITY'
    | 'EQUIPMENT'
    | 'PARTICIPANT_BUSY'
    | 'ROOM_INACTIVE'
  )[];
  alternatives: AlternativeSlot[];
}

export interface SlotDto {
  startAt: Iso;
  endAt: Iso;
  state: 'FREE' | 'BOOKED' | 'HELD' | 'BLACKOUT' | 'CLOSED' | 'PAST';
}

export interface RoomSignals {
  roomId: string;
  avgRating: number | null;
  bayesRating: number | null;
  reviewCount: number;
  openIssues: number;
  noShowRate: number;
  utilizationPct: number;
}

export interface NotificationInput {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ---- Service interfaces: THE ONLY way modules may call each other's logic ----

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

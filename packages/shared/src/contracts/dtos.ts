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

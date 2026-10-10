import { z } from 'zod';

// ---- Error codes ----
export const ERROR_CODES = [
  'VALIDATION_ERROR', 'UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND',
  'CONFLICT', 'SLOT_UNAVAILABLE', 'HOLD_EXPIRED', 'CHECKIN_WINDOW',
  'RATE_LIMITED', 'INTERNAL',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---- Envelope ----
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: { page?: number; pageSize?: number; total?: number };
}

export interface ErrorEnvelope {
  success: false;
  error: { code: ErrorCode; message: string; details?: unknown };
}

export type Envelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

// ---- Enums ----
export const UserRole = z.enum(['CLIENT', 'OWNER']);
export type UserRole = z.infer<typeof UserRole>;

export const RoomType = z.enum(['MEETING', 'BOARDROOM', 'HUDDLE', 'TRAINING', 'PHONE_BOOTH', 'COWORKING']);
export type RoomType = z.infer<typeof RoomType>;

export const RoomVibe = z.enum(['FORMAL', 'CASUAL', 'CREATIVE', 'QUIET', 'PRESENTATION']);
export type RoomVibe = z.infer<typeof RoomVibe>;

export const RoomStatus = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
export type RoomStatus = z.infer<typeof RoomStatus>;

export const EquipmentStatus = z.enum(['WORKING', 'FAULTY', 'MAINTENANCE']);
export type EquipmentStatus = z.infer<typeof EquipmentStatus>;

export const EquipmentCategory = z.enum(['DISPLAY', 'AUDIO_VIDEO', 'COLLABORATION', 'CONNECTIVITY', 'COMFORT', 'ACCESSIBILITY']);
export type EquipmentCategory = z.infer<typeof EquipmentCategory>;

export const BookingStatus = z.enum(['HELD', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RELEASED']);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const BookingSource = z.enum(['WEB', 'ROOMBOT']);
export type BookingSource = z.infer<typeof BookingSource>;

export const ParticipantStatus = z.enum(['INVITED', 'ACCEPTED', 'DECLINED']);
export type ParticipantStatus = z.infer<typeof ParticipantStatus>;

export const IssueType = z.enum(['EQUIPMENT_BROKEN', 'TOO_SMALL', 'TOO_NOISY', 'CLEANLINESS', 'OTHER']);
export type IssueType = z.infer<typeof IssueType>;

export const IssueStatus = z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']);
export type IssueStatus = z.infer<typeof IssueStatus>;

export const NotificationType = z.enum([
  'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_RELEASED', 'BOOKING_REMINDER',
  'REVIEW_REQUESTED', 'ISSUE_REPORTED', 'ISSUE_RESOLVED', 'EQUIPMENT_FLAGGED', 'SYSTEM',
]);
export type NotificationType = z.infer<typeof NotificationType>;

export const ChatRole = z.enum(['USER', 'ASSISTANT', 'SYSTEM']);
export type ChatRole = z.infer<typeof ChatRole>;

export const ReviewTag = z.enum([
  'GREAT_EQUIPMENT', 'SPACIOUS', 'QUIET', 'CLEAN', 'COMFORTABLE',
  'TOO_SMALL', 'TOO_NOISY', 'EQUIPMENT_ISSUE', 'HARD_TO_FIND',
]);
export type ReviewTag = z.infer<typeof ReviewTag>;

export const CheckinState = z.enum([
  'NO_BOOKING', 'TOO_EARLY', 'OPEN', 'ALREADY_CHECKED_IN', 'WINDOW_CLOSED', 'RELEASED', 'INVALID_TOKEN',
]);
export type CheckinState = z.infer<typeof CheckinState>;

// ---- ID helpers ----
export function generateId(): string {
  return crypto.randomUUID();
}

// ---- Time helpers ----
export type Iso = string;

// ---- Constants ----
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_RATING = 10;
export const MIN_RATING = 1;
export const BAYES_PRIOR_MEAN = 7.0;
export const BAYES_PRIOR_WEIGHT = 3;

// ---- Pagination schema ----
export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

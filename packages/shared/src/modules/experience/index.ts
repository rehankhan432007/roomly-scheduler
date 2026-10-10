import { z } from 'zod';
import { ReviewTag, IssueType, CheckinState, NotificationType } from '../../core/index.js';

// ---- Review schemas ----
export const CreateReviewInput = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(10),
  comment: z.string().max(500).optional(),
  tags: z.array(ReviewTag).default([]),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInput>;

export interface ReviewDto {
  id: string;
  bookingId: string;
  roomId: string;
  reviewerId: string;
  rating: number;
  comment: string | null;
  tags: string[];
  createdAt: string;
}

export interface ReviewSummary {
  avg: number | null;
  count: number;
  bayes: number | null;
}

export interface ReviewHistogram {
  [key: number]: number; // 1..10 -> count
}

export interface ReviewListResponse {
  summary: ReviewSummary;
  histogram: ReviewHistogram;
  tagCounts: Record<string, number>;
  items: {
    rating: number;
    comment: string | null;
    tags: string[];
    reviewerName: string;
    createdAt: string;
  }[];
}

// ---- Issue schemas ----
export const CreateIssueInput = z.object({
  roomId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  equipmentCode: z.string().optional(),
  issueType: IssueType,
  description: z.string().max(500).optional(),
}).refine(
  (data) => data.issueType !== 'EQUIPMENT_BROKEN' || !!data.equipmentCode,
  { message: 'equipmentCode is required for EQUIPMENT_BROKEN issues', path: ['equipmentCode'] },
);
export type CreateIssueInput = z.infer<typeof CreateIssueInput>;

export interface IssueDto {
  id: string;
  roomId: string;
  bookingId: string | null;
  reporterId: string;
  equipmentTypeId: string | null;
  equipmentCode: string | null;
  issueType: string;
  description: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

// ---- Check-in schemas ----
export const CheckinScanInput = z.object({
  token: z.string().min(1),
});
export type CheckinScanInput = z.infer<typeof CheckinScanInput>;

export interface CheckinResolveResponse {
  room: { name: string; location: string; floor: string | null };
  window: { opensAt: string; closesAt: string };
  state: z.infer<typeof CheckinState>;
  booking?: {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    status: string;
  };
}

// ---- RoomBot schemas ----
export const RoomBotMessageInput = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1).max(1000),
  action: z.object({
    type: z.enum(['CONFIRM_BOOKING', 'HOLD_ROOM', 'SELECT_ROOM', 'CANCEL_BOOKING']),
    payload: z.record(z.unknown()).optional(),
  }).optional(),
});
export type RoomBotMessageInput = z.infer<typeof RoomBotMessageInput>;

export type RoomBotIntent =
  | 'BOOK_ROOM' | 'CHECK_AVAILABILITY' | 'CANCEL_BOOKING'
  | 'MY_BOOKINGS' | 'CONFIRM' | 'DECLINE' | 'HELP' | 'CHITCHAT';

export interface ParsedIntent {
  intent: RoomBotIntent;
  attendeeCount?: number;
  startAt?: string;
  durationMin?: number;
  equipment?: string[];
  locationHint?: string;
  vibe?: string;
  title?: string;
}

export interface RoomBotResponse {
  sessionId: string;
  reply: string;
  intent: RoomBotIntent | null;
  suggestions: import('../../contracts/index.js').RoomMatch[];
  quickReplies: string[];
  action?: {
    type: 'CONFIRM_BOOKING' | 'HOLD_ROOM' | 'SELECT_ROOM' | 'CANCEL_BOOKING';
    payload?: Record<string, unknown>;
  };
  booking?: import('../../contracts/index.js').BookingDto;
}

// ---- Insights schemas ----
export interface DemandCell {
  dow: number; // 1..7
  hour: number; // 0..23
  fillRate: number;
}

export interface HeatmapResponse {
  cells: DemandCell[];
  peakWindows: { dow: number; startHour: number; endHour: number; avgRate: number }[];
  quietWindows: { dow: number; startHour: number; endHour: number; avgRate: number }[];
  suggestions: string[];
}

// ---- Notification schemas ----
export interface NotificationDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

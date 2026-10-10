// Entity types 1:1 with database schema + zod schemas
import { z } from 'zod';

// ---- Users ----
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  email: z.string().email().max(190),
  passwordHash: z.string(),
  role: z.enum(['CLIENT', 'OWNER']),
  company: z.string().max(160).nullable(),
  phone: z.string().max(32).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

// ---- Locations ----
export const locationSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(1).max(160),
  addressLine: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  state: z.string().max(100).nullable(),
  country: z.string().max(100).default('India'),
  timezone: z.string().max(64).default('Asia/Kolkata'),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Location = z.infer<typeof locationSchema>;

// ---- Rooms ----
export const roomSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  locationId: z.string().uuid(),
  name: z.string().min(1).max(160),
  description: z.string().nullable(),
  floor: z.string().max(32).nullable(),
  capacity: z.number().int().positive(),
  roomType: z.enum(['MEETING', 'BOARDROOM', 'HUDDLE', 'TRAINING', 'PHONE_BOOTH', 'COWORKING']),
  vibe: z.enum(['FORMAL', 'CASUAL', 'CREATIVE', 'QUIET', 'PRESENTATION']),
  hourlyPrice: z.number().nonnegative(),
  currency: z.string().length(3).default('INR'),
  photos: z.array(z.string()),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
  openTime: z.string(),
  closeTime: z.string(),
  openDays: z.array(z.number().int().min(1).max(7)),
  minBookingMinutes: z.number().int().positive().default(30),
  maxBookingMinutes: z.number().int().positive().default(480),
  bufferMinutes: z.number().int().nonnegative().default(0),
  checkinGraceMinutes: z.number().int().min(10).max(15).default(15),
  qrToken: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});
export type Room = z.infer<typeof roomSchema>;

// ---- Equipment Types ----
export const equipmentTypeSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  icon: z.string().min(1).max(40),
  category: z.enum(['DISPLAY', 'AUDIO_VIDEO', 'COLLABORATION', 'CONNECTIVITY', 'COMFORT', 'ACCESSIBILITY']),
});
export type EquipmentType = z.infer<typeof equipmentTypeSchema>;

// ---- Room Equipment ----
export const roomEquipmentSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  equipmentTypeId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  status: z.enum(['WORKING', 'FAULTY', 'MAINTENANCE']),
  notes: z.string().max(255).nullable(),
  flaggedAt: z.string().datetime().nullable(),
  flaggedReason: z.string().max(255).nullable(),
});
export type RoomEquipment = z.infer<typeof roomEquipmentSchema>;

// ---- Room Blackouts ----
export const roomBlackoutSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string().max(255).nullable(),
  createdAt: z.string().datetime(),
});
export type RoomBlackout = z.infer<typeof roomBlackoutSchema>;

// ---- Bookings ----
export const bookingSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  clientId: z.string().uuid(),
  title: z.string().min(1).max(160),
  notes: z.string().max(500).nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  attendeeCount: z.number().int().positive(),
  requiredEquipment: z.array(z.string()),
  status: z.enum(['HELD', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RELEASED']),
  holdExpiresAt: z.string().datetime().nullable(),
  checkedInAt: z.string().datetime().nullable(),
  cancelledAt: z.string().datetime().nullable(),
  cancelReason: z.string().max(255).nullable(),
  source: z.enum(['WEB', 'ROOMBOT']),
  totalPrice: z.number().nonnegative(),
  matchScore: z.number().int().min(0).max(100).nullable(),
  matchReason: z.string().max(500).nullable(),
  idempotencyKey: z.string().max(64).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Booking = z.infer<typeof bookingSchema>;

// ---- Booking Participants ----
export const bookingParticipantSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  email: z.string().email().max(190),
  name: z.string().max(120).nullable(),
  status: z.enum(['INVITED', 'ACCEPTED', 'DECLINED']),
});
export type BookingParticipant = z.infer<typeof bookingParticipantSchema>;

// ---- Reviews ----
export const reviewSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  roomId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  rating: z.number().int().min(1).max(10),
  comment: z.string().max(500).nullable(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
});
export type Review = z.infer<typeof reviewSchema>;

// ---- Room Issues ----
export const roomIssueSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  bookingId: z.string().uuid().nullable(),
  reporterId: z.string().uuid(),
  equipmentTypeId: z.string().uuid().nullable(),
  issueType: z.enum(['EQUIPMENT_BROKEN', 'TOO_SMALL', 'TOO_NOISY', 'CLEANLINESS', 'OTHER']),
  description: z.string().max(500).nullable(),
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
});
export type RoomIssue = z.infer<typeof roomIssueSchema>;

// ---- Room Stats ----
export const roomStatsSchema = z.object({
  roomId: z.string().uuid(),
  avgRating: z.number().nullable(),
  bayesRating: z.number().nullable(),
  reviewCount: z.number().int().nonnegative(),
  bookingCount: z.number().int().nonnegative(),
  noShowCount: z.number().int().nonnegative(),
  openIssueCount: z.number().int().nonnegative(),
  utilizationPct: z.number().nonnegative(),
  updatedAt: z.string().datetime(),
});
export type RoomStats = z.infer<typeof roomStatsSchema>;

// ---- Slot Demand Stats ----
export const slotDemandStatsSchema = z.object({
  locationId: z.string().uuid(),
  dayOfWeek: z.number().int().min(1).max(7),
  hourOfDay: z.number().int().min(0).max(23),
  fillRate: z.number().min(0).max(100),
  sampleSize: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});
export type SlotDemandStats = z.infer<typeof slotDemandStatsSchema>;

// ---- Chat Sessions ----
export const chatSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  state: z.unknown().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ChatSession = z.infer<typeof chatSessionSchema>;

// ---- Chat Messages ----
export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  role: z.enum(['USER', 'ASSISTANT', 'SYSTEM']),
  content: z.string(),
  metadata: z.unknown().nullable(),
  createdAt: z.string().datetime(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

// ---- Notifications ----
export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum([
    'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_RELEASED',
    'BOOKING_REMINDER', 'REVIEW_REQUESTED', 'ISSUE_REPORTED',
    'ISSUE_RESOLVED', 'EQUIPMENT_FLAGGED', 'SYSTEM',
  ]),
  title: z.string().max(160),
  body: z.string().max(500),
  data: z.unknown().nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof notificationSchema>;

// Enums derived from the database schema (001_core_schema.sql)

export const UserRole = {
  CLIENT: 'CLIENT',
  OWNER: 'OWNER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const RoomType = {
  MEETING: 'MEETING',
  BOARDROOM: 'BOARDROOM',
  HUDDLE: 'HUDDLE',
  TRAINING: 'TRAINING',
  PHONE_BOOTH: 'PHONE_BOOTH',
  COWORKING: 'COWORKING',
} as const;
export type RoomType = (typeof RoomType)[keyof typeof RoomType];

export const RoomVibe = {
  FORMAL: 'FORMAL',
  CASUAL: 'CASUAL',
  CREATIVE: 'CREATIVE',
  QUIET: 'QUIET',
  PRESENTATION: 'PRESENTATION',
} as const;
export type RoomVibe = (typeof RoomVibe)[keyof typeof RoomVibe];

export const RoomStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE',
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const EquipmentCategory = {
  DISPLAY: 'DISPLAY',
  AUDIO_VIDEO: 'AUDIO_VIDEO',
  COLLABORATION: 'COLLABORATION',
  CONNECTIVITY: 'CONNECTIVITY',
  COMFORT: 'COMFORT',
  ACCESSIBILITY: 'ACCESSIBILITY',
} as const;
export type EquipmentCategory = (typeof EquipmentCategory)[keyof typeof EquipmentCategory];

export const EquipmentStatus = {
  WORKING: 'WORKING',
  FAULTY: 'FAULTY',
  MAINTENANCE: 'MAINTENANCE',
} as const;
export type EquipmentStatus = (typeof EquipmentStatus)[keyof typeof EquipmentStatus];

export const BookingStatus = {
  HELD: 'HELD',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  RELEASED: 'RELEASED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const ParticipantStatus = {
  INVITED: 'INVITED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
} as const;
export type ParticipantStatus = (typeof ParticipantStatus)[keyof typeof ParticipantStatus];

export const BookingSource = {
  WEB: 'WEB',
  ROOMBOT: 'ROOMBOT',
} as const;
export type BookingSource = (typeof BookingSource)[keyof typeof BookingSource];

export const IssueType = {
  EQUIPMENT_BROKEN: 'EQUIPMENT_BROKEN',
  TOO_SMALL: 'TOO_SMALL',
  TOO_NOISY: 'TOO_NOISY',
  CLEANLINESS: 'CLEANLINESS',
  OTHER: 'OTHER',
} as const;
export type IssueType = (typeof IssueType)[keyof typeof IssueType];

export const IssueStatus = {
  OPEN: 'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED: 'RESOLVED',
} as const;
export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];

export const NotificationType = {
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_RELEASED: 'BOOKING_RELEASED',
  BOOKING_REMINDER: 'BOOKING_REMINDER',
  REVIEW_REQUESTED: 'REVIEW_REQUESTED',
  ISSUE_REPORTED: 'ISSUE_REPORTED',
  ISSUE_RESOLVED: 'ISSUE_RESOLVED',
  EQUIPMENT_FLAGGED: 'EQUIPMENT_FLAGGED',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const ChatRole = {
  USER: 'USER',
  ASSISTANT: 'ASSISTANT',
  SYSTEM: 'SYSTEM',
} as const;
export type ChatRole = (typeof ChatRole)[keyof typeof ChatRole];

export const SlotState = {
  FREE: 'FREE',
  BOOKED: 'BOOKED',
  HELD: 'HELD',
  BLACKOUT: 'BLACKOUT',
  CLOSED: 'CLOSED',
  PAST: 'PAST',
} as const;
export type SlotState = (typeof SlotState)[keyof typeof SlotState];

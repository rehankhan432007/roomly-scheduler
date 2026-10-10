export const ROOM_TYPE = ['MEETING','BOARDROOM','HUDDLE','TRAINING','PHONE_BOOTH','COWORKING'] as const;
export type RoomType = typeof ROOM_TYPE[number];

export const VIBE = ['FORMAL','CASUAL','CREATIVE','QUIET','PRESENTATION'] as const;
export type Vibe = typeof VIBE[number];

export const BOOKING_STATUS = ['HELD','CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','NO_SHOW','RELEASED'] as const;
export type BookingStatus = typeof BOOKING_STATUS[number];

export const ROOM_STATUS = ['ACTIVE','INACTIVE','MAINTENANCE'] as const;
export type RoomStatus = typeof ROOM_STATUS[number];

export const EQUIPMENT_STATUS = ['WORKING','FAULTY','MAINTENANCE'] as const;
export type EquipmentStatus = typeof EQUIPMENT_STATUS[number];

export const USER_ROLE = ['CLIENT','OWNER'] as const;
export type UserRole = typeof USER_ROLE[number];

export const ISSUE_TYPE = ['EQUIPMENT_BROKEN','TOO_SMALL','TOO_NOISY','CLEANLINESS','OTHER'] as const;
export type IssueType = typeof ISSUE_TYPE[number];

export const BOOKING_SOURCE = ['WEB','ROOMBOT'] as const;
export type BookingSource = typeof BOOKING_SOURCE[number];

export const EQUIPMENT_CATEGORY = ['DISPLAY','AUDIO_VIDEO','COLLABORATION','CONNECTIVITY','COMFORT','ACCESSIBILITY'] as const;
export type EquipmentCategory = typeof EQUIPMENT_CATEGORY[number];

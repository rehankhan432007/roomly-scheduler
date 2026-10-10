export declare const ROOM_TYPE: readonly ["MEETING", "BOARDROOM", "HUDDLE", "TRAINING", "PHONE_BOOTH", "COWORKING"];
export type RoomType = typeof ROOM_TYPE[number];
export declare const VIBE: readonly ["FORMAL", "CASUAL", "CREATIVE", "QUIET", "PRESENTATION"];
export type Vibe = typeof VIBE[number];
export declare const BOOKING_STATUS: readonly ["HELD", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW", "RELEASED"];
export type BookingStatus = typeof BOOKING_STATUS[number];
export declare const ROOM_STATUS: readonly ["ACTIVE", "INACTIVE", "MAINTENANCE"];
export type RoomStatus = typeof ROOM_STATUS[number];
export declare const EQUIPMENT_STATUS: readonly ["WORKING", "FAULTY", "MAINTENANCE"];
export type EquipmentStatus = typeof EQUIPMENT_STATUS[number];
export declare const USER_ROLE: readonly ["CLIENT", "OWNER"];
export type UserRole = typeof USER_ROLE[number];
export declare const ISSUE_TYPE: readonly ["EQUIPMENT_BROKEN", "TOO_SMALL", "TOO_NOISY", "CLEANLINESS", "OTHER"];
export type IssueType = typeof ISSUE_TYPE[number];
export declare const BOOKING_SOURCE: readonly ["WEB", "ROOMBOT"];
export type BookingSource = typeof BOOKING_SOURCE[number];
export declare const EQUIPMENT_CATEGORY: readonly ["DISPLAY", "AUDIO_VIDEO", "COLLABORATION", "CONNECTIVITY", "COMFORT", "ACCESSIBILITY"];
export type EquipmentCategory = typeof EQUIPMENT_CATEGORY[number];
//# sourceMappingURL=enums.d.ts.map
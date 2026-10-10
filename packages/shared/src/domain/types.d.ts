import type { Iso } from '../core/envelope.js';
import type { RoomType, Vibe, BookingStatus, RoomStatus, EquipmentStatus, UserRole, BookingSource } from '../core/enums.js';
export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    company?: string | null;
    phone?: string | null;
    createdAt: Iso;
    updatedAt: Iso;
}
export interface Location {
    id: string;
    ownerId: string;
    name: string;
    addressLine: string;
    city: string;
    state?: string | null;
    country: string;
    timezone: string;
    latitude?: number | null;
    longitude?: number | null;
    createdAt: Iso;
    updatedAt: Iso;
}
export interface Room {
    id: string;
    ownerId: string;
    locationId: string;
    name: string;
    description?: string | null;
    floor?: string | null;
    capacity: number;
    roomType: RoomType;
    vibe: Vibe;
    hourlyPrice: number;
    currency: string;
    photos: string[];
    status: RoomStatus;
    openTime: string;
    closeTime: string;
    openDays: number[];
    minBookingMinutes: number;
    maxBookingMinutes: number;
    bufferMinutes: number;
    checkinGraceMinutes: number;
    qrToken: string;
    createdAt: Iso;
    updatedAt: Iso;
    deletedAt?: Iso | null;
}
export interface EquipmentType {
    id: string;
    code: string;
    name: string;
    icon: string;
    category: string;
}
export interface RoomEquipment {
    id: string;
    roomId: string;
    equipmentTypeId: string;
    quantity: number;
    status: EquipmentStatus;
    notes?: string | null;
    flaggedAt?: Iso | null;
    flaggedReason?: string | null;
}
export interface Booking {
    id: string;
    roomId: string;
    clientId: string;
    title: string;
    notes?: string | null;
    startAt: Iso;
    endAt: Iso;
    attendeeCount: number;
    requiredEquipment: string[];
    status: BookingStatus;
    holdExpiresAt?: Iso | null;
    checkedInAt?: Iso | null;
    cancelledAt?: Iso | null;
    cancelReason?: string | null;
    source: BookingSource;
    totalPrice: number;
    matchScore?: number | null;
    matchReason?: string | null;
    idempotencyKey?: string | null;
    createdAt: Iso;
    updatedAt: Iso;
}
export interface Review {
    id: string;
    bookingId: string;
    roomId: string;
    reviewerId: string;
    rating: number;
    comment?: string | null;
    tags: string[];
    createdAt: Iso;
}
export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown> | null;
    readAt?: Iso | null;
    createdAt: Iso;
}
//# sourceMappingURL=types.d.ts.map
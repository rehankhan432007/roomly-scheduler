import { z } from 'zod';

// --- Room creation/update schemas ---
export const baseRoomSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  locationId: z.string().uuid(),
  floor: z.string().max(32).optional(),
  capacity: z.number().int().min(1).max(500),
  roomType: z.enum(['MEETING', 'BOARDROOM', 'HUDDLE', 'TRAINING', 'PHONE_BOOTH', 'COWORKING']).default('MEETING'),
  vibe: z.enum(['FORMAL', 'CASUAL', 'CREATIVE', 'QUIET', 'PRESENTATION']).default('FORMAL'),
  hourlyPrice: z.number().min(0).default(0),
  photos: z.array(z.string().url()).max(6).default([]),
  openTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).default('09:00'),
  closeTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).default('19:00'),
  openDays: z.array(z.number().int().min(1).max(7)).default([1, 2, 3, 4, 5]),
  minBookingMinutes: z.number().int().min(15).max(480).refine(v => v % 15 === 0, 'Must be multiple of 15').default(30),
  maxBookingMinutes: z.number().int().min(15).max(480).refine(v => v % 15 === 0, 'Must be multiple of 15').default(480),
  bufferMinutes: z.number().int().min(0).max(60).default(0),
  checkinGraceMinutes: z.number().int().min(10).max(15).default(15),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).default('ACTIVE'),
  equipment: z.array(z.object({
    code: z.string(),
    quantity: z.number().int().min(1).default(1),
    status: z.enum(['WORKING', 'FAULTY', 'MAINTENANCE']).default('WORKING'),
    notes: z.string().max(255).optional(),
  })).default([]),
});

export const createRoomSchema = baseRoomSchema.refine(
  data => data.minBookingMinutes <= data.maxBookingMinutes,
  { message: 'minBookingMinutes must be <= maxBookingMinutes', path: ['minBookingMinutes'] }
);

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = baseRoomSchema.partial().omit({ locationId: true, equipment: true });
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

// --- Location schemas ---
export const createLocationSchema = z.object({
  name: z.string().min(1).max(160),
  addressLine: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  country: z.string().max(100).default('India'),
  timezone: z.string().default('Asia/Kolkata'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = createLocationSchema.partial();
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

// --- Equipment schemas ---
export const replaceEquipmentSchema = z.array(z.object({
  code: z.string(),
  quantity: z.number().int().min(1).default(1),
  status: z.enum(['WORKING', 'FAULTY', 'MAINTENANCE']).default('WORKING'),
  notes: z.string().max(255).optional(),
}));

export const patchEquipmentSchema = z.object({
  status: z.enum(['WORKING', 'FAULTY', 'MAINTENANCE']),
  notes: z.string().max(255).optional(),
});

// --- Blackout schemas ---
export const createBlackoutSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string().max(255).optional(),
}).refine(
  data => new Date(data.endAt) > new Date(data.startAt),
  { message: 'endAt must be after startAt', path: ['endAt'] }
);

// --- Query schemas ---
export const ownerRoomsQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
  locationId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const ownerBookingsQuerySchema = z.object({
  status: z.string().optional(),
  roomId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const dashboardQuerySchema = z.object({
  range: z.enum(['7d', '30d']).default('7d'),
});

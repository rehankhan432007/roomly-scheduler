import { z } from 'zod';

export const CreateBookingSchema = z.object({
  roomId: z.string().uuid(),
  title: z.string().min(1).max(160),
  notes: z.string().max(500).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  attendeeCount: z.number().int().positive(),
  requiredEquipment: z.array(z.string()).optional().default([]),
  participantEmails: z.array(z.string().email()).optional().default([]),
  source: z.enum(['WEB','ROOMBOT']).optional().default('WEB'),
  matchScore: z.number().int().min(0).max(100).optional(),
  matchReason: z.string().max(500).optional(),
  idempotencyKey: z.string().max(64).optional(),
});

export const SearchCriteriaSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  attendeeCount: z.number().int().min(1),
  requiredEquipment: z.array(z.string()).optional().default([]),
  locationId: z.string().uuid().optional(),
  city: z.string().optional(),
  vibe: z.string().optional(),
  maxHourlyPrice: z.number().positive().optional(),
  participantEmails: z.array(z.string().email()).optional().default([]),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

export const CancelBookingSchema = z.object({
  reason: z.string().max(255).optional(),
});

export const RescheduleBookingSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export const CheckConflictsSchema = CreateBookingSchema;

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type SearchCriteriaInput = z.infer<typeof SearchCriteriaSchema>;

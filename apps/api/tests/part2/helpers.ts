import { z } from 'zod';
import type { ZodTypeAny } from 'zod';

export function createApiErrorSchema(codes: string[]) {
  return z.object({
    success: z.literal(false),
    error: z.object({
      code: z.enum(codes as [string, ...string[]]),
      message: z.string(),
      details: z.any().optional(),
    }),
  });
}

import { z } from 'zod';

/**
 * 🚦 Rate Limit Schema
 * Tracks requests per IP/Identifier to prevent volumetric attacks.
 */
export const RateLimitSchema = z.object({
  _id: z.any().optional(),
  key: z.string(), // E.g., "login:192.168.1.1"
  points: z.number().default(0),
  expireAt: z.date(),
});

export type RateLimit = z.infer<typeof RateLimitSchema>;

import { z } from 'zod';

/**
 * 🗝️ Password Reset Token Schema
 * Certified for industrial identity recovery.
 */
export const ResetTokenSchema = z.object({
  _id: z.union([z.string(), z.any()]).optional(),
  userId: z.string(),
  token: z.string(), // Hashed token
  expiresAt: z.date(),
  createdAt: z.date().default(() => new Date()),
  usedAt: z.date().optional(),
});

export type ResetToken = z.infer<typeof ResetTokenSchema>;

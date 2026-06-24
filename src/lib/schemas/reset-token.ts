/**
 * @purpose Valida y define la estructura de un token de reinicio de contraseña.
 * @purpose_en Validates and defines the structure of a password reset token.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:1vbbart
 * @lastUpdated 2026-06-23T22:43:07.266Z
 */

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

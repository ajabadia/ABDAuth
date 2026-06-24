/**
 * @purpose Valida y define la estructura de datos de sesión del usuario.
 * @purpose_en Validates and defines the structure of user session data.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:140k35k
 * @lastUpdated 2026-06-23T22:43:11.075Z
 */

import { z } from 'zod';
import { TenantIdSchema } from './common';

/**
 * 🗝️ User Session Schema
 * Tracks active industrial sessions across the ecosystem.
 */
export const UserSessionSchema = z.object({
  _id: z.any().optional(),
  userId: z.string(),
  email: z.string().email(),
  tenantId: TenantIdSchema,
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  device: z.object({
    browser: z.string().optional(),
    os: z.string().optional(),
    type: z.enum(['DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN']).default('UNKNOWN')
  }).optional(),
  isCurrent: z.boolean().default(false),
  lastActive: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date(),
});

export type UserSession = z.infer<typeof UserSessionSchema>;

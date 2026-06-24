/**
 * @purpose Valida y define el esquema para datos de limitación de velocidad, incluyendo seguimiento de solicitudes por IP/Identificador.
 * @purpose_en Validates and defines the schema for rate limiting data, including tracking requests per IP/Identifier.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:oa5c97
 * @lastUpdated 2026-06-23T22:43:03.362Z
 */

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

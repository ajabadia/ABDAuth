/**
 * @purpose Valida y define la estructura de los datos de aplicación para su uso en ABDAuth.
 * @purpose_en Validates and defines the structure of application data for use in ABDAuth.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:3,imports:1,sig:lndpm6
 * @lastUpdated 2026-06-23T22:42:34.045Z
 */

import { z } from 'zod';

/**
 * 🛰️ Application (Satellite) Schema
 * Defines clients that can use ABDAuth for federated identity.
 */
export const ApplicationSchema = z.object({
  _id: z.any().optional(),
  name: z.string().min(2),
  description: z.string().optional().default(''),
  clientId: z.string().uuid(),
  clientSecret: z.string().min(32),
  redirectUris: z.array(z.string().url()).min(1, "At least one redirect URI is required"),
  slug: z.string().optional(),
  urlPattern: z.string().optional(),
  active: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional(),
});

export type Application = z.infer<typeof ApplicationSchema>;

export type DbUpdateApplication = Partial<Omit<Application, '_id'>>;

/**
 * @purpose Valida el esquema de entrada para solicitudes de intercambio de tokens en autenticación federada.
 * @purpose_en Validates the input schema for token exchange requests in federated authentication.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:10y6orl
 * @lastUpdated 2026-06-23T22:38:12.897Z
 */

import { z } from 'zod';

/**
 * 🎫 Federated Token Schema
 */
export const TokenExchangeSchema = z.object({
  code: z.string().min(1),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  redirect_uri: z.string().url().optional(),
});

export type TokenExchangeInput = z.infer<typeof TokenExchangeSchema>;

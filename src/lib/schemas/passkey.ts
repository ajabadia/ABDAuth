/**
 * @purpose Valida y establece la estructura de datos de passkey utilizando la plantilla Zod para autenticación biometrica/passwordless.
 * @purpose_en Defines and validates the structure of passkey data using Zod schema for biometric/passwordless authentication.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:1hux769
 * @lastUpdated 2026-06-23T22:42:57.929Z
 */

import { z } from 'zod';

/**
 * 🔑 Passkey Schema
 * WebAuthn Credential definition for biometric / passwordless auth.
 */
export const PasskeySchema = z.object({
  _id: z.any().optional(),
  userId: z.string(),
  credentialID: z.string(), // Base64URL encoded
  publicKey: z.string(),    // Base64URL encoded (COSE public key or raw depending on implementation)
  counter: z.number().default(0),
  transports: z.array(z.string()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional(),
});

export type Passkey = z.infer<typeof PasskeySchema>;

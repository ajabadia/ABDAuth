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

import { z } from 'zod';

/**
 * 🛡️ Login Credentials Schema
 */
export const LoginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6).optional(),
    passkeyBypassToken: z.string().optional(),
    tenantId: z.string().optional()
  })
  .refine(data => data.password || data.passkeyBypassToken, {
    message: "Either password or passkeyBypassToken must be provided"
  });

export type LoginCredentials = z.infer<typeof LoginSchema>;

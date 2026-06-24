/**
 * @purpose Valida los credenciales de inicio de sesión, incluyendo correo electrónico, contraseña, token de bypass de clave y ID del inquilino.
 * @purpose_en Validates login credentials including email, password, passkey bypass token, and tenant ID.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:cefx2d
 * @lastUpdated 2026-06-23T22:44:20.203Z
 */

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

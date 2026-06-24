/**
 * @purpose Gestiona un token JWT firmado para autenticación de Single Sign-On.
 * @purpose_en Generates a signed JWT token for Single Sign-On (SSO) authentication.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:xgafhy
 * @lastUpdated 2026-06-23T23:00:35.211Z
 */

import { SignJWT } from 'jose';
import type { SsoPayload } from './types/sso-payload';

/**
 * 🔑 Gets the JWT signing secret.
 */
export function getSsoSecretKey(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_JWT_SECRET or AUTH_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

/**
 * 🗝️ Generate standard signed JWT token for SSO handshake.
 * Valid for 2 hours (per DISENO_SSO_TENANTS.md spec)
 */
export async function generateToken(payload: SsoPayload): Promise<string> {
  const secret = getSsoSecretKey();
  return await new SignJWT({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    surname: payload.surname,
    tenantId: payload.tenantId,
    role: payload.role,
    permissions: payload.permissions,
    dbPrefix: payload.dbPrefix,
    isolationStrategy: payload.isolationStrategy,
    allowedApps: payload.allowedApps,
    groups: payload.groups || [],
    ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

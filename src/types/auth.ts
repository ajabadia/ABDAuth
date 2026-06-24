/**
 * @purpose Proporciona plantillas y tipos para perfiles de usuario industriales y sesiones dentro del ecosistema ABD.
 * @purpose_en Defines TypeScript interfaces and types for industrial user profiles and sessions within the ABD Ecosystem.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:12fuqxg
 * @lastUpdated 2026-06-23T23:01:05.347Z
 */

import type { UserRole } from "@/lib/schemas/auth";

/**
 * 👤 Industrial User Profile
 * Canonical definition of identity within the ABD Ecosystem.
 */
export interface IndustrialUser {
  id: string;
  name: string;
  surname?: string;
  email: string;
  role: UserRole;
  tenantId: string;
  sessionId?: string; // 🗝️ Telemetry Session Reference
  dbPrefix: string;
  isolationStrategy: 'COLLECTION_PREFIX' | 'DATABASE_PER_TENANT';
  mfaEnabled: boolean;
  mfaEnforced: boolean;
  mfa_verified: boolean;
  mfaGracePeriodActive?: boolean;
  mfaGraceLoginsRemaining?: number;
  mfaGraceExpiresAt?: string;
  mfaGraceBypassed?: boolean;
  active?: boolean;
  loginAttempts?: number;
  lockoutUntil?: Date;
}

export type IndustrialSession = IndustrialUser;

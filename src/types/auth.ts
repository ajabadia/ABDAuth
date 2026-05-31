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

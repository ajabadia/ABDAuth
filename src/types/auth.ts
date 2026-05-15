import type { UserRole } from "@/lib/schemas/auth";
import "next-auth";
import "next-auth/jwt";

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
  dbPrefix: string;
  isolationStrategy: 'COLLECTION_PREFIX' | 'DATABASE_PER_TENANT';
  mfa_verified: boolean;
}

export type IndustrialSession = IndustrialUser;

// 🛡️ Module Augmentation for Auth.js (v5 Beta Standard)
declare module "next-auth" {
  interface Session {
    user: IndustrialSession;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends IndustrialUser {}
}

declare module "next-auth/jwt" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface JWT extends IndustrialUser {}
}

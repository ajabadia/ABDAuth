import type { UserRole } from "@/lib/schemas/auth";
import type { User as NextAuthUser } from "next-auth";

/**
 * 👤 Industrial User (NextAuth Extension)
 * Used within auth providers and callbacks.
 */
export interface IndustrialUser extends NextAuthUser {
  id: string;
  name: string;
  surname?: string;
  email: string;
  role: UserRole;
  tenantId: string;
  mfa_verified: boolean;
}

/**
 * 🔑 Industrial User Session
 * Unified type for authenticated users across the platform.
 */
export interface IndustrialSession {
  id: string;
  name: string;
  surname?: string;
  email: string;
  role: UserRole;
  tenantId: string;
  mfa_verified: boolean;
}

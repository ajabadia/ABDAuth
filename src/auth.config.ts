import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@/lib/schemas/auth';
import type { IndustrialUser } from '@/types/auth';

/**
 * 🔒 Auth.js Configuration (Edge-Compatible)
 * This file contains the configuration that can run on the Edge runtime.
 * We avoid importing database adapters or heavy libraries here.
 */
export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  basePath: '/api/auth',
  trustHost: true,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const raw = user as unknown as IndustrialUser;
        token.role = raw.role;
        token.tenantId = raw.tenantId;
        token.sessionId = raw.sessionId;
        token.mfaEnabled = raw.mfaEnabled ?? false;
        token.mfaEnforced = raw.mfaEnforced ?? false;
        token.mfa_verified = raw.mfa_verified ?? false;
      }
      
      // 🔄 Support for unstable_update()
      if (trigger === "update" && session?.user) {
        const updatedUser = session.user as IndustrialUser;
        if (updatedUser.mfa_verified !== undefined) token.mfa_verified = updatedUser.mfa_verified;
        if (updatedUser.mfaEnabled !== undefined) token.mfaEnabled = updatedUser.mfaEnabled;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const u = session.user as IndustrialUser;
        
        u.id = token.sub || ''; 
        u.role = token.role as UserRole;
        u.tenantId = token.tenantId as string;
        u.sessionId = token.sessionId as string;
        u.mfaEnabled = token.mfaEnabled as boolean;
        u.mfaEnforced = token.mfaEnforced as boolean;
        u.mfa_verified = token.mfa_verified as boolean;
      }
      return session;
    },
  },
  providers: [], // Providers are added in auth.ts to keep this file edge-safe
} satisfies NextAuthConfig;

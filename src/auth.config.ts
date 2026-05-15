import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@/lib/schemas/auth';

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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // user here is the raw object returned from authorize()
        const raw = user as unknown as Record<string, unknown>;
        token.role = raw.role as UserRole;
        token.tenantId = raw.tenantId as string;
        token.mfa_verified = (raw.mfa_verified as boolean) ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const u = session.user as unknown as Record<string, unknown>;
        u.role = token.role;
        u.tenantId = token.tenantId as string;
        u.mfa_verified = token.mfa_verified as boolean;
      }
      return session;
    },
  },
  providers: [], // Providers are added in auth.ts to keep this file edge-safe
} satisfies NextAuthConfig;

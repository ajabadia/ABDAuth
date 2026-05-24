import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { SessionService } from '@/services/auth/SessionService';
import type { EntityId } from '@/lib/schemas/common';
import type { IndustrialUser } from '@/types/auth';
import { authorizeUser } from '@/services/auth/actions/authorize-user';

/**
 * 🛂 Unified Authentication Engine
 * Initialized with full Node.js capabilities (Database, Bcrypt, etc.)
 */
export const { auth, signIn, signOut, handlers, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        return authorizeUser(credentials);
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      const iUser = user as unknown as IndustrialUser;
      
      await auditRepository.create({
        timestamp: new Date(),
        event: 'LOGIN_SUCCESS',
        actorId: iUser.id || 'UNKNOWN',
        actorEmail: iUser.email || undefined,
        tenantId: iUser.tenantId,
        status: 'SUCCESS'
      });
    },
    async signOut(message) {
      const msg = message as { session?: { user: IndustrialUser } };
      const session = msg.session;
      if (session?.user) {
        const sUser = session.user as IndustrialUser;
        
        // 🚫 Revoke Persistent Session in LOGS Cluster
        if (sUser.sessionId) {
          try {
            await SessionService.revokeSession(
              sUser.sessionId, 
              sUser.id as EntityId, 
              sUser.tenantId
            );
          } catch (error) {
            console.error('[AUTH ERROR] Failed to revoke session during logout:', error);
          }
        }

        await auditRepository.create({
          timestamp: new Date(),
          event: 'LOGOUT',
          actorId: sUser.id || 'UNKNOWN',
          actorEmail: sUser.email || undefined,
          tenantId: sUser.tenantId,
          status: 'SUCCESS'
        });
      }
    }
  }
});

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { SessionService } from '@/services/auth/SessionService';
import type { EntityId } from '@/lib/schemas/common';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import type { IndustrialUser } from '@/types/auth';

/**
 * 🛂 Unified Authentication Engine
 * Initialized with full Node.js capabilities (Database, Bcrypt, etc.)
 */
export const { auth, signIn, signOut, handlers, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          const user = await userRepository.findByEmail(email);
          if (!user) {
            await auditRepository.create({
              timestamp: new Date(),
              event: 'LOGIN_FAILURE',
              actorId: 'SYSTEM',
              actorEmail: email,
              status: 'FAILURE',
              metadata: { reason: 'USER_NOT_FOUND' }
            });
            return null;
          }
          
          // 🛡️ Account Lockout Guard
          if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            await auditRepository.create({
              timestamp: new Date(),
              event: 'LOGIN_FAILURE',
              actorId: user._id?.toString() || 'UNKNOWN',
              actorEmail: email,
              tenantId: user.tenantId,
              status: 'FAILURE',
              metadata: { reason: 'ACCOUNT_LOCKED' }
            });
            throw new Error('ACCOUNT_LOCKED');
          }

          // 🛡️ Activation Guard
          if (!user.active) {
            throw new Error('ACCOUNT_INACTIVE');
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) {
            // Reset attempts on success
            if (user.loginAttempts > 0 || user.lockoutUntil) {
              await userRepository.update(user._id as EntityId, {
                loginAttempts: 0,
                lockoutUntil: undefined,
              });
            }

            const tenant = await tenantRepository.findByTenantId(user.tenantId);
            
            // 🗝️ Create Persistent Session in LOGS Cluster
            let sessionId = undefined;
            try {
              sessionId = await SessionService.createSession({
                userId: user._id?.toString() || '',
                email: user.email,
                tenantId: user.tenantId,
              });
            } catch {
              // Non-blocking session failure
            }

            return {
              id: user._id?.toString() || '',
              sessionId: sessionId,
              name: user.name,
              surname: user.surname,
              email: user.email,
              role: user.role,
              tenantId: user.tenantId,
              dbPrefix: tenant?.dbPrefix || 'default',
              isolationStrategy: tenant?.isolationStrategy || 'COLLECTION_PREFIX',
              mfaEnabled: !!user.mfaEnabled,
              mfaEnforced: !!user.mfaEnforced,
              mfa_verified: false,
            } as unknown as IndustrialUser;
          } else {
            // Increment attempts on failure
            const newAttempts = (user.loginAttempts || 0) + 1;
            const updateData: Partial<IndustrialUser> = { loginAttempts: newAttempts };
            
            if (newAttempts >= 5) {
              updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min
            }

            await userRepository.update(user._id as EntityId, updateData);

            await auditRepository.create({
              timestamp: new Date(),
              event: 'LOGIN_FAILURE',
              actorId: user._id?.toString() || 'UNKNOWN',
              actorEmail: email,
              tenantId: user.tenantId,
              status: 'FAILURE',
              metadata: { reason: 'INVALID_PASSWORD', attempts: newAttempts }
            });
          }
        }

        return null;
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
          } catch {
            // Silently fail for cleanup operations in production
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

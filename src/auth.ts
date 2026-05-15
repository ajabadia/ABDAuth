import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import type { IndustrialUser } from '@/types/auth';

/**
 * 🛂 Unified Authentication Engine
 * Initialized with full Node.js capabilities (Database, Bcrypt, etc.)
 */
export const { auth, signIn, signOut, handlers } = NextAuth({
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

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return {
              id: user._id?.toString() || '',
              name: user.name,
              surname: user.surname,
              email: user.email,
              role: user.role,
              tenantId: user.tenantId,
              mfa_verified: false,
            } as unknown as IndustrialUser;
          } else {
            await auditRepository.create({
              timestamp: new Date(),
              event: 'LOGIN_FAILURE',
              actorId: user._id?.toString() || 'UNKNOWN',
              actorEmail: email,
              tenantId: user.tenantId,
              status: 'FAILURE',
              metadata: { reason: 'INVALID_PASSWORD' }
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

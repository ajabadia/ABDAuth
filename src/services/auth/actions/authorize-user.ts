import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { SessionService } from '@/services/auth/SessionService';
import type { EntityId, TenantId } from '@/lib/schemas/common';
import type { IndustrialUser } from '@/types/auth';

export async function authorizeUser(credentials: Record<string, any> | undefined): Promise<IndustrialUser | null> {
  if (process.env.NODE_ENV === 'development') {
    console.log("[AUTHORIZE_USER] Called for email:", credentials?.email);
  }
  const parsedCredentials = z
    .object({
      email: z.string().email(),
      password: z.string().min(6).optional(),
      passkeyBypassToken: z.string().optional(),
      tenantId: z.string().optional()
    })
    .refine(data => data.password || data.passkeyBypassToken, {
      message: "Either password or passkeyBypassToken must be provided"
    })
    .safeParse(credentials);

  if (parsedCredentials.success) {
    const { email, password, passkeyBypassToken, tenantId: requestedTenantId } = parsedCredentials.data;
    
    const user = await userRepository.findByEmail(email);
    if (process.env.NODE_ENV === 'development') {
      console.log("[AUTHORIZE_USER] User lookup in MongoDB:", user ? `Found (Active: ${user.active})` : "NULL");
    }
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

    let isBypassOrPasswordValid = false;

    if (passkeyBypassToken) {
      try {
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET || 'secret');
        const { payload } = await jwtVerify(passkeyBypassToken, secret);
        
        if (payload.email === email && payload.passkeyLogin) {
          isBypassOrPasswordValid = true;
        } else {
          throw new Error('INVALID_BYPASS_TOKEN');
        }
      } catch (err) {
        await auditRepository.create({
          timestamp: new Date(),
          event: 'LOGIN_FAILURE',
          actorId: user._id?.toString() || 'UNKNOWN',
          actorEmail: email,
          tenantId: user.tenantId,
          status: 'FAILURE',
          metadata: { reason: 'INVALID_BYPASS_TOKEN' }
        });
        return null;
      }
    } else {
      isBypassOrPasswordValid = await bcrypt.compare(password!, user.password);
    }

    if (isBypassOrPasswordValid) {
      // Reset attempts on success
      if (user.loginAttempts > 0 || user.lockoutUntil) {
        await userRepository.update(user._id as EntityId, {
          loginAttempts: 0,
          lockoutUntil: undefined,
        });
      }

      // 🛡️ Tenant Resolution
      let activeTenantId: TenantId = user.tenantId; // Default to primary tenant
      
      if (user.role === 'SUPER_ADMIN') {
        activeTenantId = 'GLOBAL' as TenantId;
      } else if (requestedTenantId) {
        // Validate requested tenant membership
        const userTenantIds = user.tenantIds || [];
        if (requestedTenantId === user.tenantId || userTenantIds.includes(requestedTenantId as TenantId)) {
          activeTenantId = requestedTenantId as TenantId;
        } else {
          throw new Error('UNAUTHORIZED_TENANT_ACCESS');
        }
      } else if (user.tenantIds && user.tenantIds.length > 0) {
        // If they have multiple tenants but didn't specify one, we can either default to primary
        // or throw an error to trigger the UI selector. For now, default to primary.
        activeTenantId = user.tenantId;
      }

      let dbPrefix = '';
      let isolationStrategy = '';
      
      if (activeTenantId !== 'GLOBAL') {
        const tenant = await tenantRepository.findByTenantId(activeTenantId);
        if (tenant && tenant.dbPrefix) {
          dbPrefix = tenant.dbPrefix;
          isolationStrategy = tenant.isolationStrategy;
        } else {
          throw new Error('TENANT_NOT_FOUND_OR_MISSING_PREFIX');
        }
      } else {
        dbPrefix = 'global_';
        isolationStrategy = 'COLLECTION_PREFIX';
      }
      
      // 🗝️ Create Persistent Session in LOGS Cluster
      let sessionId = undefined;
      try {
        sessionId = await SessionService.createSession({
          userId: user._id?.toString() || '',
          email: user.email,
          tenantId: activeTenantId,
        });
      } catch (error) {
        console.error('[AUTH ERROR] Failed to create session during login:', error);
      }

      let mfaGracePeriodActive = !!user.mfaGracePeriodActive;
      let mfaGraceLoginsRemaining = user.mfaGraceLoginsRemaining ?? 0;
      const mfaGraceExpiresAt = user.mfaGraceExpiresAt;

      if (mfaGracePeriodActive) {
        const now = new Date();
        if (mfaGraceExpiresAt && new Date(mfaGraceExpiresAt) < now) {
          mfaGracePeriodActive = false;
          await userRepository.update(user._id as EntityId, {
            mfaGracePeriodActive: false,
            updatedAt: now,
          });
        } else if (mfaGraceLoginsRemaining <= 0) {
          mfaGracePeriodActive = false;
          await userRepository.update(user._id as EntityId, {
            mfaGracePeriodActive: false,
            updatedAt: now,
          });
        }
      }

      return {
        id: user._id?.toString() || '',
        sessionId: sessionId,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        tenantId: activeTenantId,
        dbPrefix: dbPrefix,
        isolationStrategy: isolationStrategy,
        mfaEnabled: !!user.mfaEnabled,
        mfaEnforced: !!user.mfaEnforced,
        mfa_verified: false,
        mfaGracePeriodActive,
        mfaGraceLoginsRemaining,
        mfaGraceExpiresAt: mfaGraceExpiresAt ? new Date(mfaGraceExpiresAt).toISOString() : undefined,
        mfaGraceBypassed: false,
      } as IndustrialUser;
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log("[AUTHORIZE_USER] Password mismatch. Incrementing login attempts.");
      }
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
}

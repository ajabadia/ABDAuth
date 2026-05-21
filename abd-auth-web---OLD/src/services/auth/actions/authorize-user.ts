import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { SessionService } from '@/services/auth/SessionService';
import type { EntityId, TenantId } from '@/lib/schemas/common';
import type { IndustrialUser } from '@/types/auth';

export async function authorizeUser(credentials: Record<string, any> | undefined): Promise<IndustrialUser | null> {
  console.log("[AUTHORIZE_USER] Called with:", credentials ? { email: credentials.email, hasPassword: !!credentials.password } : "undefined");
  const parsedCredentials = z
    .object({ email: z.string().email(), password: z.string().min(6), tenantId: z.string().optional() })
    .safeParse(credentials);

  if (parsedCredentials.success) {
    const { email, password, tenantId: requestedTenantId } = parsedCredentials.data;
    
    const user = await userRepository.findByEmail(email);
    console.log("[AUTHORIZE_USER] User lookup in MongoDB:", user ? { id: user._id, email: user.email, role: user.role, active: user.active } : "NULL");
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
    console.log("[AUTHORIZE_USER] Bcrypt compare result:", passwordsMatch);
    if (passwordsMatch) {
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

      // Fetch tenant configuration for DB prefix unless GLOBAL
      let dbPrefix = 'default';
      let isolationStrategy = 'COLLECTION_PREFIX';
      
      if (activeTenantId !== 'GLOBAL') {
        const tenant = await tenantRepository.findByTenantId(activeTenantId);
        if (tenant) {
          dbPrefix = tenant.dbPrefix;
          isolationStrategy = tenant.isolationStrategy;
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
        tenantId: activeTenantId,
        dbPrefix: dbPrefix,
        isolationStrategy: isolationStrategy,
        mfaEnabled: !!user.mfaEnabled,
        mfaEnforced: !!user.mfaEnforced,
        mfa_verified: false,
      } as unknown as IndustrialUser;
    } else {
      console.log("[AUTHORIZE_USER] Password mismatch. Incrementing login attempts.");
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

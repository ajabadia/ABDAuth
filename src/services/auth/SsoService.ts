import { SignJWT } from 'jose';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { auditAuthOpsRepository } from '@/lib/repositories/AuditAuthOpsRepository';
import type { TenantId } from '@/lib/schemas/common';
import type { Application } from '@/lib/schemas/auth';
import type { SafeFilter } from '@/lib/repositories/BaseRepository';

export interface SsoPayload {
  sub: string;
  email: string;
  name: string;
  surname: string;
  tenantId: string;
  role: string;
  permissions: string[];
  dbPrefix: string;
  isolationStrategy: string;
  allowedApps: string[];
  groups?: string[];
  /** 🔐 Central session ID for back-channel SLO validation */
  sessionId?: string;
}

/**
 * 🛰️ SsoService
 * Handles cryptographic signing and issuing of SSO JWT tokens for satellites.
 * Encapsulates full handshake orchestration.
 */
export class SsoService {
  private static getSecretKey(): Uint8Array {
    const secret = process.env.AUTH_JWT_SECRET || process.env.AUTH_SECRET || 'abd-auth-industrial-fallback-secret-2026';
    return new TextEncoder().encode(secret);
  }

  private static async audit(
    action: 'SSO_HANDSHAKE_GRANTED' | 'SSO_HANDSHAKE_DENIED',
    params: { tenantId: string; appId: string; userId: string; userEmail: string; ipAddress?: string; userAgent?: string },
    changedFields: Record<string, unknown>
  ) {
    await auditAuthOpsRepository.create({
      tenantId: params.tenantId,
      action,
      entityType: 'SSO',
      entityId: params.appId,
      userId: params.userId,
      userEmail: params.userEmail,
      changedFields,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * 🗝️ Generate standard signed JWT token
   * Valid for 2 hours (per DISENO_SSO_TENANTS.md spec)
   */
  static async generateToken(payload: SsoPayload): Promise<string> {
    const secret = this.getSecretKey();
    return await new SignJWT({
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      surname: payload.surname,
      tenantId: payload.tenantId,
      role: payload.role,
      permissions: payload.permissions,
      dbPrefix: payload.dbPrefix,
      isolationStrategy: payload.isolationStrategy,
      allowedApps: payload.allowedApps,
      groups: payload.groups || [],
      // 🔐 Back-channel SLO: embed central session ID in satellite token
      ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret);
  }

  /**
   * 🔌 Perform Federated SSO Handshake Verification
   * Validates active session memberships, licenses, application states, and triggers audit logging.
   */
  static async performSsoHandshake(params: {
    appId: string;
    tenantId: string;
    userId: string;
    userEmail: string;
    userName: string;
    userSurname?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ success: boolean; redirectUrl?: string; errorType?: string }> {
    const { appId, tenantId, userId, userEmail, userName, userSurname, ipAddress, userAgent } = params;

    // 1. Verify User Membership in Target Tenant
    const dbUser = await userRepository.findById(userId);
    if (!dbUser) return { success: false, errorType: 'USER_NOT_FOUND' };

    const isSuperAdmin = dbUser.role === 'SUPER_ADMIN';
    const membership = dbUser.tenants?.find(t => t.tenantId === tenantId);
    const hasMembership = isSuperAdmin || 
                          dbUser.tenantId === tenantId || 
                          dbUser.tenantIds?.includes(tenantId as TenantId) || 
                          !!membership;

    const auditMeta = { tenantId, appId, userId, userEmail, ipAddress, userAgent };

    if (!hasMembership) {
      await this.audit('SSO_HANDSHAKE_DENIED', auditMeta, { appId, reason: 'UNAUTHORIZED_TENANT_ACCESS' });
      return { success: false, errorType: 'UNAUTHORIZED_TENANT_ACCESS' };
    }

    // 2. Verify Tenant Active Status (Skip for GLOBAL)
    let tenant = null;
    let tenantAllowedApps: string[] = [];
    
    if (tenantId !== 'GLOBAL') {
      tenant = await tenantRepository.findByTenantId(tenantId as TenantId);
      if (!tenant || !tenant.active || !tenant.dbPrefix) {
        await this.audit('SSO_HANDSHAKE_DENIED', auditMeta, { appId, reason: 'TENANT_INACTIVE_OR_MISSING_PREFIX' });
        return { success: false, errorType: 'TENANT_INACTIVE' };
      }
      tenantAllowedApps = tenant.allowedApps || [];
    }

    // 3. Verify App License / Allowance for Tenant (Skip for GLOBAL)
    if (tenantId !== 'GLOBAL') {
      const isTenantLicensed = tenantAllowedApps.includes(appId);
      if (!isTenantLicensed) {
        await this.audit('SSO_HANDSHAKE_DENIED', auditMeta, { appId, reason: 'APPLICATION_NOT_LICENSED' });
        return { success: false, errorType: 'APPLICATION_NOT_LICENSED' };
      }
    }

    // 4. Find Application Details
    const app = await applicationRepository.findOne({ slug: appId } as SafeFilter<Application>);
    if (!app || !app.active) {
      await this.audit('SSO_HANDSHAKE_DENIED', auditMeta, { appId, reason: 'APPLICATION_INACTIVE_OR_NOT_FOUND' });
      return { success: false, errorType: 'APPLICATION_INACTIVE' };
    }

    // 5. Resolve Roles, Permissions and allowedApps for this user session
    const role = membership?.role || dbUser.role;
    const permissions = membership?.appPermissions || [];
    const userAllowedApps = membership?.allowedApps || [];
    const resolvedAllowedApps = (isSuperAdmin || role === 'owner' || role === 'admin')
      ? tenantAllowedApps
      : tenantAllowedApps.filter(a => userAllowedApps.includes(a));

    // For normal users, verify they are licensed for this specific app
    if (!isSuperAdmin && role !== 'owner' && role !== 'admin' && !userAllowedApps.includes(appId)) {
      await this.audit('SSO_HANDSHAKE_DENIED', auditMeta, { appId, reason: 'USER_NOT_LICENSED_FOR_APP' });
      return { success: false, errorType: 'APPLICATION_NOT_LICENSED' };
    }

    // 6. Generate outgoing Signed SSO JWT
    const token = await this.generateToken({
      sub: userId,
      email: userEmail,
      name: userName,
      surname: userSurname || '',
      tenantId,
      role,
      permissions,
      dbPrefix: tenantId === 'GLOBAL' ? 'global_' : tenant!.dbPrefix,
      isolationStrategy: tenantId === 'GLOBAL' ? 'COLLECTION_PREFIX' : (tenant!.isolationStrategy || 'COLLECTION_PREFIX'),
      allowedApps: resolvedAllowedApps,
      groups: membership?.groupIds || [],
    });

    // 7. Resolve Destination URL with Tenant sub-domain pattern injection
    const targetPattern = app.urlPattern || app.redirectUris[0];
    const destinationUrl = targetPattern.replace('{tenant}', tenantId);

    const redirectTarget = new URL(destinationUrl);
    redirectTarget.searchParams.set('token', token);

    // 8. Audit Handshake Success
    await this.audit('SSO_HANDSHAKE_GRANTED', auditMeta, { appId, destinationUrl });

    return { success: true, redirectUrl: redirectTarget.toString() };
  }
}

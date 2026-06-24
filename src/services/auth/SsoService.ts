/**
 * @purpose Gestiona interacciones de inicio de sesión único (SSO), generando tokens y manejando auditorías para aplicaciones satelitales.
 * @purpose_en Manages Single Sign-On (SSO) handshakes, generating tokens and handling audits for satellite applications.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:11,sig:y4v5xw
 * @lastUpdated 2026-06-23T23:00:40.093Z
 */

import crypto from 'crypto';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { auditAuthOpsRepository } from '@/lib/repositories/AuditAuthOpsRepository';
import { federatedCodeRepository } from '@/lib/repositories/FederatedCodeRepository';
import type { TenantId } from '@/lib/schemas/common';
import type { Application } from '@/lib/schemas/auth';
import type { SafeFilter } from '@/lib/repositories/BaseRepository';
import { generateToken } from './sso-token';
export type { SsoPayload } from './types/sso-payload';
import type { SsoPayload } from './types/sso-payload';

/**
 * 🛰️ SsoService
 * Handles cryptographic signing and issuing of SSO JWT tokens for satellites.
 * Encapsulates full handshake orchestration.
 */
export class SsoService {
  /**
   * 🗝️ Generate standard signed JWT token
   * Delegates to the sso-token helper for signing logic.
   */
  static async generateToken(payload: SsoPayload): Promise<string> {
    return generateToken(payload);
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
   * 🔌 Perform Federated SSO Handshake Verification
   * Validates active session memberships, licenses, application states, and triggers audit logging.
   * Returns an authorization code (via redirectUrl) instead of embedding the JWT in the URL,
   * which prevents token leakage in server logs, browser history, and referrer headers.
   * The code is exchanged for a JWT via the server-side /api/auth/federated/token endpoint.
   */
  static async performSsoHandshake(params: {
    appId: string;
    tenantId: string;
    userId: string;
    userEmail: string;
    userName: string;
    userSurname?: string;
    /**
     * The satellite's callback URL (e.g. https://app.example.com/api/auth/federated/callback).
     * The authorization code will be appended as ?code=xxx&state=/
     */
    redirectUri: string;
    /** 🔐 Central session ID for back-channel SLO propagation */
    sessionId?: string;
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

    // 6. Generate short-lived authorization code (instead of embedding JWT in URL)
    const code = crypto.randomBytes(24).toString('hex');
    await federatedCodeRepository.create({
      code,
      clientId: app.clientId,
      userId: params.userId,
      redirectUri: params.redirectUri,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5-minute TTL
      used: false,
      sessionId: params.sessionId,
    });

    // 7. Redirect to satellite's callback with code (JWT will be exchanged server-side via POST)
    const callbackUrl = new URL(params.redirectUri);
    callbackUrl.searchParams.set('code', code);
    callbackUrl.searchParams.set('state', '/');

    // 8. Audit Handshake Success
    await this.audit('SSO_HANDSHAKE_GRANTED', auditMeta, { appId, callbackUrl: params.redirectUri });

    return { success: true, redirectUrl: callbackUrl.toString() };
  }
}

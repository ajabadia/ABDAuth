/**
 * @purpose Gestiona el intercambio de un código de autenticación federado para tokens de perfil y sesión industriales.
 * @purpose_en Handles the exchange of a federated authentication code for user profile and industrial session tokens.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:10,sig:1q96o29
 * @lastUpdated 2026-06-25T10:15:26.298Z
 */

import { NextResponse } from 'next/server';
import { logger } from '@ajabadia/satellite-sdk/logger';;
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { federatedCodeRepository, type FederatedCode } from '@/lib/repositories/FederatedCodeRepository';
import { type UserTenantMembership } from '@/lib/schemas/user';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { type SafeFilter } from '@/lib/repositories/BaseRepository';
import { SsoService } from '@/services/auth/SsoService';
import { TokenExchangeSchema } from './schema';

/**
 * 🎫 Federated Token Endpoint
 * Exchanges Code for User Profile & Industrial Session
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    
    // 🛡️ Security Standard: Strict Input Validation
    const validation = TokenExchangeSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid parameters', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { code, client_id, client_secret, redirect_uri } = validation.data;

    // 1. Validate Client
    const app = await applicationRepository.findByClientId(client_id);
    if (!app || app.clientSecret !== client_secret || !app.active) {
      return NextResponse.json({ error: 'Invalid client credentials' }, { status: 401 });
    }

    // 2. Validate Code
    const rawCode = await federatedCodeRepository.findOne({ code } as unknown as SafeFilter<FederatedCode>);
    if (!rawCode) {
      return NextResponse.json({ error: 'Code not found' }, { status: 400 });
    }

    if (rawCode.used) {
      const gracePeriodMs = 15000; // 15-second resilience grace window
      const usedTime = rawCode.usedAt ? new Date(rawCode.usedAt).getTime() : 0;
      const wasUsedRecently = usedTime > 0 && (Date.now() - usedTime < gracePeriodMs);

      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH_TOKEN_DUPLICATE_CHECK]', {
          code,
          clientId: rawCode.clientId,
          used: rawCode.used,
          usedAt: rawCode.usedAt,
          usedTime,
          now: Date.now(),
          diffMs: Date.now() - usedTime,
          wasUsedRecently,
        });
      }

      if (!wasUsedRecently) {
        return NextResponse.json({ error: 'Code already used' }, { status: 400 });
      }
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUTH_TOKEN_GRACE_WINDOW] Allowing double-request token exchange`);
      }
    }

    if (rawCode.clientId !== client_id) {
      return NextResponse.json({ error: 'Client ID mismatch' }, { status: 400 });
    }

    if (rawCode.redirectUri !== redirect_uri) {
      return NextResponse.json({ error: 'Redirect URI mismatch' }, { status: 400 });
    }

    if (rawCode.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 });
    }

    // 3. Mark code as used (Atomic Security)
    await federatedCodeRepository.markAsUsed(rawCode._id);

    // 4. Fetch User Info
    const user = await userRepository.findById(rawCode.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tenant = await tenantRepository.findByTenantId(user.tenantId);

    // Resolve membership details
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const membership = user.tenants?.find((t: UserTenantMembership) => t.tenantId === user.tenantId);
    const role = isSuperAdmin ? 'SUPER_ADMIN' : (membership?.role || user.role);
    const permissions = membership?.appPermissions || [];
    
    const tenantAllowedApps = tenant?.allowedApps || [];
    const userAllowedApps = membership?.allowedApps || [];
    const resolvedAllowedApps = (isSuperAdmin || role === 'owner' || role === 'admin')
      ? [...tenantAllowedApps]
      : tenantAllowedApps.filter((app: string) => userAllowedApps.includes(app));

    if (!resolvedAllowedApps.includes('landing')) {
      resolvedAllowedApps.push('landing');
    }

    // 5. Generate cryptographically signed JWT via SsoService
    const token = await SsoService.generateToken({
      sub: user._id?.toString() || '',
      email: user.email,
      name: user.name,
      surname: user.surname || '',
      role,
      tenantId: user.tenantId,
      permissions,
      dbPrefix: tenant?.dbPrefix || 'default',
      isolationStrategy: tenant?.isolationStrategy || 'COLLECTION_PREFIX',
      allowedApps: resolvedAllowedApps,
      groups: membership?.groupIds || [],
      // 🔐 Back-channel SLO: propagate central session ID into the satellite token
      sessionId: rawCode.sessionId || undefined,
    });

    await logger.audit({
      tenantId: user.tenantId || 'unknown',
      action: 'FEDERATED_TOKEN_EXCHANGE',
      entityType: 'SSO',
      entityId: user._id?.toString() || 'unknown',
      userId: user._id?.toString() || 'system',
      userEmail: user.email || 'system@abd.com',
      changedFields: { clientId: client_id, appSlug: app.slug },
    });

    // 6. Build Industrial Response (JWT + auxiliary user data)
    return NextResponse.json({
      token,
      user: {
        id: user._id?.toString(),
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        tenantId: user.tenantId,
        branding: tenant?.branding || null,
      }
    });

  } catch {
    // 🛡️ Security Standard: Opaque error messages for production
    return NextResponse.json({ 
      error: 'Identity exchange failed',
      code: 'FEDERATION_ERROR'
    }, { status: 500 });
  }
}

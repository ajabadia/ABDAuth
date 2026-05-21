import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { federatedCodeRepository } from '@/lib/repositories/FederatedCodeRepository';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import type { UserTenantMembership } from '@/lib/schemas/user';
import type { TenantId } from '@/lib/schemas/common';
import type { IndustrialUser } from '@/types/auth';
import crypto from 'crypto';

/**
 * 📡 Federated Authorization Endpoint
 * Standard: OAuth2-like Authorization Code Flow
 *
 * Includes proactive governance checks to enforce tenant membership
 * and per-user app licensing before emitting the authorization code.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state') || '';
  const tenantParam = searchParams.get('tenant') || '';
  const errorParam = searchParams.get('error');

  // Prevent infinite authorization/redirect loops if the client app reports an error
  if (errorParam) {
    const errorMap: Record<string, string> = {
      'app_not_allowed': 'APPLICATION_NOT_LICENSED',
      'unauthorized_tenant_access': 'UNAUTHORIZED_TENANT_ACCESS',
    };
    const mappedError = errorMap[errorParam] || errorParam.toUpperCase();
    const dashboardUrl = new URL('/dashboard', req.url);
    dashboardUrl.searchParams.set('error', mappedError);
    
    if (clientId) {
      const app = await applicationRepository.findByClientId(clientId);
      if (app) {
        dashboardUrl.searchParams.set('app', app.slug || app.name);
      }
    }
    
    return NextResponse.redirect(dashboardUrl);
  }

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Missing client_id or redirect_uri' }, { status: 400 });
  }

  // 1. Validate Application
  const app = await applicationRepository.findByClientId(clientId);
  if (!app || !app.active) {
    return NextResponse.json({ error: 'Invalid or inactive client' }, { status: 401 });
  }

  // 2. Validate Redirect URI (Security Standard with Dynamic Subdomain matching)
  const isRedirectValid = (() => {
    if (app.redirectUris.includes(redirectUri)) return true;
    try {
      const reqUrl = new URL(redirectUri);
      for (const reg of app.redirectUris) {
        try {
          const regUrl = new URL(reg);
          if (
            reqUrl.protocol !== regUrl.protocol ||
            reqUrl.pathname !== regUrl.pathname ||
            reqUrl.port !== regUrl.port
          ) {
            continue;
          }
          const reqHost = reqUrl.hostname;
          const regHost = regUrl.hostname;
          if (reqHost.endsWith(regHost)) {
            const prefix = reqHost.substring(0, reqHost.length - regHost.length);
            if (prefix === '' || prefix.endsWith('.')) {
              return true;
            }
          }
        } catch {
          // Ignore invalid registered URL parsing errors
        }
      }
    } catch {
      // Ignore invalid incoming redirectUri parsing errors
    }
    return false;
  })();

  if (!isRedirectValid) {
    return NextResponse.json({ error: 'Redirect URI mismatch' }, { status: 400 });
  }

  // 3. Check Session
  const session = await auth();
  if (!session?.user) {
    const loginUrl = new URL('/login', req.url);
    const callback = new URL(req.url);
    
    if (tenantParam) {
      callback.searchParams.set('tenant', tenantParam);
      loginUrl.searchParams.set('tenant', tenantParam);
    }
    
    loginUrl.searchParams.set('callbackUrl', callback.toString());
    return NextResponse.redirect(loginUrl);
  }

  // 4. 🛡️ PROACTIVE GOVERNANCE VALIDATION
  // Resolve the effective tenantId: prefer explicit tenant param, fallback to session default
  const user = await userRepository.findById(session.user.id || '');
  const effectiveTenantId = tenantParam || user?.tenantId || '';
  const appSlug = app.slug || app.name?.toLowerCase() || '';
  const dashboardUrl = new URL('/dashboard', req.url);

  if (user) {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      // 4a. Validate global user account status
      if (user.active === false) {
        dashboardUrl.searchParams.set('error', 'UNAUTHORIZED_TENANT_ACCESS');
        dashboardUrl.searchParams.set('app', appSlug);
        return NextResponse.redirect(dashboardUrl);
      }

      // 4b. Validate user has an active membership in the target tenant
      const membership: UserTenantMembership | undefined = user.tenants?.find(
        (t: UserTenantMembership) => t.tenantId === effectiveTenantId
      );

      if (!membership || membership.status === 'suspended') {
        dashboardUrl.searchParams.set('error', 'UNAUTHORIZED_TENANT_ACCESS');
        dashboardUrl.searchParams.set('app', appSlug);
        return NextResponse.redirect(dashboardUrl);
      }

      // 4c. Validate the app is licensed for this tenant
      const tenant = await tenantRepository.findByTenantId(effectiveTenantId as TenantId);
      const tenantAllowedApps = tenant?.allowedApps || [];

      if (appSlug && !tenantAllowedApps.includes(appSlug)) {
        dashboardUrl.searchParams.set('error', 'APPLICATION_NOT_LICENSED');
        dashboardUrl.searchParams.set('app', appSlug);
        return NextResponse.redirect(dashboardUrl);
      }

      // 4d. Validate the app is explicitly allowed for this user
      // (Admins and owners inherit all tenant apps; students need explicit allowance)
      const isPrivilegedRole = membership.role === 'admin' || membership.role === 'owner';
      if (!isPrivilegedRole && appSlug) {
        const userAllowedApps = membership.allowedApps || [];
        if (!userAllowedApps.includes(appSlug)) {
          dashboardUrl.searchParams.set('error', 'APPLICATION_NOT_LICENSED');
          dashboardUrl.searchParams.set('app', appSlug);
          return NextResponse.redirect(dashboardUrl);
        }
      }
    }
  }

  // 5. Generate Authorization Code
  const code = crypto.randomBytes(24).toString('hex');
  // 🔐 Propagate central session ID for back-channel SLO
  const centralUser = session.user as unknown as IndustrialUser;
  await federatedCodeRepository.create({
    code,
    clientId,
    userId: session.user.id || '',
    redirectUri,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes industrial TTL
    used: false,
    sessionId: centralUser.sessionId || undefined,
  });

  // 6. Redirect back to Satellite with authorization code
  const target = new URL(redirectUri);
  target.searchParams.set('code', code);
  if (state) target.searchParams.set('state', state);

  return NextResponse.redirect(target);
}

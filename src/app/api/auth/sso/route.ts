import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/get-session';
import { SsoService } from '@/services/auth/SsoService';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { isRedirectUriValid } from '../federated/authorize/redirect-validator';
import type { SafeFilter } from '@/lib/repositories/BaseRepository';
import type { Application } from '@/lib/schemas/auth';

/**
 * 🛰️ SSO Gateway Handshake Endpoint
 * GET /api/auth/sso?appId=[appId]&tenantId=[tenantId]&redirectUri=[optional-override]
 * 
 * Delegates authentication checks, membership verification, and auditing to SsoService.
 * Uses the application's registered redirectUris to issue an authorization code
 * instead of embedding the JWT in the URL (prevents token leakage).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');
  const tenantParam = searchParams.get('tenantId');
  const overrideRedirectUri = searchParams.get('redirectUri');
  const stateParam = searchParams.get('state') || '/';
  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined;
  const userAgent = req.headers.get('user-agent') ?? undefined;

  if (!appId) {
    return NextResponse.json({ error: 'Missing appId parameter' }, { status: 400 });
  }

  // 1. Verify User Authentication Session
  const session = await getServerSession();
  if (!session?.user) {
    let locale = 'es';
    if (stateParam.startsWith('/en') || stateParam.startsWith('/en/')) {
      locale = 'en';
    }
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const user = session.user;

  // 2. Prevent infinite SSO redirect loop
  const ssoRetryCount = parseInt(searchParams.get('sso_retry') || '0', 10);
  if (ssoRetryCount >= 3) {
    console.error(`[SSO_LOOP_DETECTED] Infinite redirect loop detected for appId: ${appId}, tenantId: ${tenantParam || user.tenantId}`);
    return NextResponse.redirect(new URL(`/dashboard?error=SSO_LOOP_DETECTED&appId=${appId}`, req.url));
  }

  // 3. Resolve Active Tenant ID
  const tenantId = tenantParam || user.tenantId;
  if (!tenantId || tenantId === 'GLOBAL') {
    return NextResponse.redirect(new URL('/dashboard?error=SELECT_TENANT_REQUIRED', req.url));
  }

  // 4. Look up application registration to resolve redirect URI
  const app = await applicationRepository.findOne({
    $or: [{ slug: appId }, { name: appId }]
  } as unknown as SafeFilter<Application>);

  if (!app || !app.active || !app.redirectUris?.length) {
    console.error(`[SSO_ROUTE] Application not found or has no redirect URIs: ${appId}`);
    return NextResponse.redirect(new URL(`/dashboard?error=APPLICATION_INACTIVE&appId=${appId}`, req.url));
  }

  // 5. Resolve redirect URI: prefer override, validate against registered URIs
  const redirectUri = overrideRedirectUri
    ? (isRedirectUriValid(overrideRedirectUri, app.redirectUris) ? overrideRedirectUri : null)
    : app.redirectUris[0];

  if (!redirectUri) {
    console.error(`[SSO_ROUTE] Invalid or mismatched redirect URI for app: ${appId}`);
    return NextResponse.redirect(new URL(`/dashboard?error=INVALID_REDIRECT_URI&appId=${appId}`, req.url));
  }

  try {
    const result = await SsoService.performSsoHandshake({
      appId,
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userSurname: user.surname ?? undefined,
      redirectUri,
      ipAddress,
      userAgent
    });

    if (result.success && result.redirectUrl) {
      const targetUrl = new URL(result.redirectUrl);
      // Propagate caller's state (redirect target) if provided
      if (stateParam !== '/') {
        targetUrl.searchParams.set('state', stateParam);
      }
      // Propagate sso_retry counter to help satellite identify/mitigate loops
      targetUrl.searchParams.set('sso_retry', String(ssoRetryCount + 1));
      return NextResponse.redirect(targetUrl);
    } else {
      return NextResponse.redirect(new URL(`/dashboard?error=${result.errorType || 'INTERNAL_ERROR'}`, req.url));
    }
  } catch (error) {
    console.error('[SSO_HANDSHAKE] Internal failure:', error);
    return NextResponse.redirect(new URL('/dashboard?error=INTERNAL_ERROR', req.url));
  }
}

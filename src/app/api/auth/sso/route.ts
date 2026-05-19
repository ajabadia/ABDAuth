import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SsoService } from '@/services/auth/SsoService';

/**
 * 🛰️ SSO Gateway Handshake Endpoint
 * GET /api/auth/sso?appId=[appId]&tenantId=[tenantId]
 * 
 * Delegates authentication checks, membership verification, and auditing to SsoService.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');
  const tenantParam = searchParams.get('tenantId');
  const ipAddress = req.headers.get('x-forwarded-for') || undefined;
  const userAgent = req.headers.get('user-agent') || undefined;

  if (!appId) {
    return NextResponse.json({ error: 'Missing appId parameter' }, { status: 400 });
  }

  // 1. Verify User Authentication Session
  const session = await auth();
  if (!session?.user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const user = session.user;

  // 2. Resolve Active Tenant ID
  const tenantId = tenantParam || user.tenantId;
  if (!tenantId || tenantId === 'GLOBAL') {
    return NextResponse.redirect(new URL('/dashboard?error=SELECT_TENANT_REQUIRED', req.url));
  }

  try {
    const result = await SsoService.performSsoHandshake({
      appId,
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userSurname: user.surname,
      ipAddress,
      userAgent
    });

    if (result.success && result.redirectUrl) {
      return NextResponse.redirect(new URL(result.redirectUrl));
    } else {
      return NextResponse.redirect(new URL(`/dashboard?error=${result.errorType || 'INTERNAL_ERROR'}`, req.url));
    }
  } catch (error) {
    console.error('[SSO_HANDSHAKE] Internal failure:', error);
    return NextResponse.redirect(new URL('/dashboard?error=INTERNAL_ERROR', req.url));
  }
}

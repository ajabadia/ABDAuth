import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { federatedCodeRepository } from '@/lib/repositories/FederatedCodeRepository';
import crypto from 'crypto';

/**
 * 📡 Federated Authorization Endpoint
 * Standard: OAuth2-like Authorization Code Flow
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state') || '';
  const tenantParam = searchParams.get('tenant') || '';

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
        } catch {}
      }
    } catch {}
    return false;
  })();

  if (!isRedirectValid) {
    return NextResponse.json({ error: 'Redirect URI mismatch' }, { status: 400 });
  }

  // 3. Check Session
  const session = await auth();
  if (!session?.user) {
    // Redirect to login with original return parameters and tenant pre-vesting data
    const loginUrl = new URL('/login', req.url);
    const callback = new URL(req.url);
    
    if (tenantParam) {
      callback.searchParams.set('tenant', tenantParam);
      loginUrl.searchParams.set('tenant', tenantParam);
    }
    
    loginUrl.searchParams.set('callbackUrl', callback.toString());
    return NextResponse.redirect(loginUrl);
  }

  // 4. Generate Authorization Code
  const code = crypto.randomBytes(24).toString('hex');
  await federatedCodeRepository.create({
    code,
    clientId,
    userId: session.user.id || '',
    redirectUri,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes industrial TTL
    used: false,
  });

  // 5. Redirect back to Satellite
  const target = new URL(redirectUri);
  target.searchParams.set('code', code);
  if (state) target.searchParams.set('state', state);

  return NextResponse.redirect(target);
}


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

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Missing client_id or redirect_uri' }, { status: 400 });
  }

  // 1. Validate Application
  const app = await applicationRepository.findByClientId(clientId);
  if (!app || !app.active) {
    return NextResponse.json({ error: 'Invalid or inactive client' }, { status: 401 });
  }

  // 2. Validate Redirect URI (Security Standard)
  if (!app.redirectUris.includes(redirectUri)) {
    return NextResponse.json({ error: 'Redirect URI mismatch' }, { status: 400 });
  }

  // 3. Check Session
  const session = await auth();
  if (!session?.user) {
    // Redirect to login with original return parameters
    const loginUrl = new URL('/login', req.url);
    const callback = new URL(req.url);
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

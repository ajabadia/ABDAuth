/**
 * @purpose Gestiona el flujo de autorización OIDC redirigiendo a los usuarios a la URL de autorización del proveedor externo.
 * @purpose_en Handles the OIDC authorization flow by redirecting users to an external provider's authorization URL.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:4,sig:lo0p48
 * @lastUpdated 2026-06-23T22:38:19.133Z
 */

import { NextResponse } from 'next/server';
import { identityProviderRepository } from '@/lib/repositories/IdentityProviderRepository';
import { FederationService } from '@/services/auth/FederationService';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * 🌐 OIDC Authorization Endpoint
 * GET /api/auth/federation/oidc/authorize?provider=PROVIDER_ID&redirect=/path
 *
 * Initiates the OIDC authentication flow by redirecting the user
 * to the external provider's authorization URL.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get('provider');
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  if (!providerId) {
    return NextResponse.json({ error: 'Missing provider parameter' }, { status: 400 });
  }

  try {
    const provider = await identityProviderRepository.findOne({
      _id: providerId,
      active: true,
      providerType: 'OIDC',
    } as unknown as Parameters<typeof identityProviderRepository.findOne>[0]);

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found or inactive' }, { status: 404 });
    }

    if (!provider.issuerUrl || !provider.clientId) {
      return NextResponse.json({ error: 'Provider misconfigured: missing issuerUrl or clientId' }, { status: 400 });
    }

    // Discover OIDC configuration
    const config = await FederationService.discoverOIDCConfiguration(provider.issuerUrl);

    // Generate state parameter (CSRF protection)
    const state = crypto.randomBytes(32).toString('hex');
    const stateData = JSON.stringify({
      state,
      providerId: provider._id?.toString(),
      redirect: redirectPath,
      nonce: crypto.randomBytes(16).toString('hex'),
    });

    // Store state in a cookie (will be validated in callback)
    const callbackUrl = `${new URL(req.url).origin}/api/auth/federation/oidc/callback`;
    const authorizeUrl = FederationService.buildAuthorizeUrl(provider, config, state, callbackUrl);

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set('oidc_state', Buffer.from(stateData).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 300, // 5 minutes
    });

    return response;
  } catch (error) {
    console.error('[OIDC_AUTHORIZE]', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=FEDERATION_ERROR&details=${encodeURIComponent((error as Error).message)}`, req.url)
    );
  }
}

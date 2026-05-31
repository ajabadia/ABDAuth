import { NextResponse } from 'next/server';
import { identityProviderRepository } from '@/lib/repositories/IdentityProviderRepository';
import { FederationService } from '@/services/auth/FederationService';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { setFederatedSession } from '@/services/auth/federated-session';
import type { IdentityProvider } from '@/lib/schemas/identity-provider';

export const dynamic = 'force-dynamic';

/**
 * 🌐 OIDC Callback Endpoint
 * GET /api/auth/federation/oidc/callback?code=...&state=...
 *
 * Handles the OIDC provider's redirect, exchanges the code for tokens,
 * verifies the ID token, fetches userinfo, and creates/authenticates the user.
 */
export async function GET(req: Request) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get('code');
    const returnedState = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OIDC provider error (e.g. user denied consent)
    if (error) {
      console.error('[OIDC_CALLBACK] Provider returned error:', error);
      return NextResponse.redirect(new URL('/dashboard?error=FEDERATION_DENIED', req.url));
    }

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    // Validate CSRF state
    const storedStateCookie = req.headers.get('cookie')
      ?.split(';')
      .find(c => c.trim().startsWith('oidc_state='));

    if (!storedStateCookie) {
      return NextResponse.json({ error: 'Missing state cookie - session expired' }, { status: 400 });
    }

    let stateData: { state: string; providerId: string; redirect: string };
    try {
      const decoded = JSON.parse(
        Buffer.from(storedStateCookie.split('=')[1], 'base64').toString()
      );
      stateData = decoded;
    } catch {
      return NextResponse.json({ error: 'Invalid state cookie' }, { status: 400 });
    }

    if (!returnedState || returnedState !== stateData.state) {
      return NextResponse.json({ error: 'State mismatch - possible CSRF attack' }, { status: 403 });
    }

    // Fetch provider configuration
    const provider = await identityProviderRepository.findOne({
      _id: stateData.providerId,
      active: true,
    } as any) as IdentityProvider | null;

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    if (!provider.issuerUrl) {
      return NextResponse.json({ error: 'Provider has no issuer URL' }, { status: 400 });
    }

    // Discover OIDC config (may be cached)
    const config = await FederationService.discoverOIDCConfiguration(provider.issuerUrl);

    // Exchange code for tokens
    const callbackUrl = `${origin}/api/auth/federation/oidc/callback`;
    const tokens = await FederationService.exchangeCode(provider, config, code, callbackUrl);

    // Verify ID token
    let providerUser: Record<string, unknown>;
    try {
      providerUser = await FederationService.verifyIdToken(tokens.idToken, provider, config);
    } catch {
      // Fallback: fetch userinfo endpoint with access token
      const userinfoEndpoint = config.userinfo_endpoint || provider.userinfoEndpoint;
      if (!userinfoEndpoint) {
        throw new Error('ID token verification failed and no userinfo endpoint available');
      }
      providerUser = await FederationService.fetchUserInfo(userinfoEndpoint, tokens.accessToken);
    }

    // Map provider claims to ABD user fields
    const mappedUser = FederationService.mapProviderUser(providerUser, provider.attributeMapping);

    if (!mappedUser.email) {
      return NextResponse.json({ error: 'Provider did not return an email address' }, { status: 400 });
    }

    // Check domain whitelist
    const userDomain = mappedUser.email.split('@')[1];
    if (provider.allowedDomains?.length > 0 && !provider.allowedDomains.includes(userDomain)) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=DOMAIN_NOT_ALLOWED&domain=${encodeURIComponent(userDomain)}`, req.url)
      );
    }

    // Find or create user by federated email
    let user = await userRepository.findByEmail(mappedUser.email);

    if (!user) {
      if (!provider.autoProvision) {
        // Redirect to registration with provider prefill
        const registerUrl = new URL('/register', req.url);
        registerUrl.searchParams.set('email', mappedUser.email);
        registerUrl.searchParams.set('name', mappedUser.name);
        registerUrl.searchParams.set('surname', mappedUser.surname);
        registerUrl.searchParams.set('federated', 'true');
        registerUrl.searchParams.set('provider', provider._id?.toString() || '');
        return NextResponse.redirect(registerUrl);
      }

      // Auto-provision user
      const tenantId = provider.defaultTenantId || 'GLOBAL';
      const tenant = await tenantRepository.findByTenantId(tenantId as any);
      const newUserId = await userRepository.create({
        email: mappedUser.email,
        name: mappedUser.name,
        surname: mappedUser.surname || '',
        role: mappedUser.role as any || 'USER',
        tenantId,
        tenants: [],
        activeModules: [],
        active: true,
        mfaEnabled: false,
        mfaEnforced: false,
        loginAttempts: 0,
        preferences: {},
        password: '',
      } as any);

      user = await userRepository.findById(newUserId);
      if (!user) {
        throw new Error('Failed to create user after auto-provisioning');
      }
    }

    // Create session via MongoDB and set cookie
    const response = await setFederatedSession({
      userId: user._id?.toString() || '',
      redirectTo: stateData.redirect || '/dashboard',
      req,
    });

    // Clear the state cookie
    response.cookies.set('oidc_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('[OIDC_CALLBACK]', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=FEDERATION_ERROR&details=${encodeURIComponent((error as Error).message)}`, req.url)
    );
  }
}

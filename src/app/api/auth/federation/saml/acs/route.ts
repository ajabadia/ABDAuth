/**
 * @purpose Gestiona el servicio de consumidor de afirmaciones SAML para autenticación, procesa respuestas SAML de proveedores de identidad externos y crea/autentica usuarios.
 * @purpose_en Handles the SAML Assertion Consumer Service for authentication, processing SAML responses from external Identity Providers and creating/authenticating users.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:7,sig:1kuyd2e
 * @lastUpdated 2026-06-25T10:15:49.299Z
 */

import { NextResponse } from 'next/server';
import { logger } from '@ajabadia/satellite-sdk/logger';
import { identityProviderRepository } from '@/lib/repositories/IdentityProviderRepository';
import { userRepository } from '@/lib/repositories/UserRepository';
import { setFederatedSession } from '@/services/auth/federated-session';
import { SAMLService } from '@/services/auth/SAMLService';
import type { IdentityProvider } from '@/lib/schemas/identity-provider';

export const dynamic = 'force-dynamic';

/**
 * 🌐 SAML Assertion Consumer Service
 * POST /api/auth/federation/saml/acs
 *
 * Receives SAML responses from external Identity Providers,
 * parses the assertion, validates attributes, and creates/authenticates the user.
 *
 * Accepts both form-encoded (HTTP-POST binding) and JSON payloads.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let samlResponse: string;
    let relayState = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      samlResponse = body.SAMLResponse;
      relayState = body.RelayState || '';
    } else {
      const formData = await req.formData();
      samlResponse = formData.get('SAMLResponse') as string;
      relayState = (formData.get('RelayState') as string) || '';
    }

    if (!samlResponse) {
      return NextResponse.json({ error: 'Missing SAMLResponse' }, { status: 400 });
    }

    // Decode base64 SAML response
    let samlXml: string;
    try {
      samlXml = Buffer.from(samlResponse, 'base64').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'Invalid base64 SAMLResponse' }, { status: 400 });
    }

    // Extract issuer from SAML response using fast-xml-parser
    const entityId = SAMLService.extractIssuer(samlXml);

    if (!entityId) {
      return NextResponse.json({ error: 'Could not extract Issuer from SAML response' }, { status: 400 });
    }

    const provider = await identityProviderRepository.findOne({
      $or: [
        { entityId },
        { issuerUrl: entityId },
      ],
      active: true,
      providerType: 'SAML',
    } as unknown as Parameters<typeof identityProviderRepository.findOne>[0]) as IdentityProvider | null;

    if (!provider) {
      return NextResponse.json({ error: 'No active SAML provider found for issuer: ' + entityId }, { status: 404 });
    }

    // Extract attributes using fast-xml-parser
    const attributes = SAMLService.extractAttributes(samlXml);

    if (!attributes.email) {
      return NextResponse.json({ error: 'SAML assertion did not contain NameID or email attribute' }, { status: 400 });
    }

    // Map attributes using provider's attribute mapping
    const mappedUser = SAMLService.mapSAMLUser(samlXml, provider.attributeMapping);

    if (!mappedUser.email) {
      return NextResponse.json({ error: 'Could not resolve email from SAML attributes' }, { status: 400 });
    }

    // Check domain whitelist
    const userDomain = mappedUser.email.split('@')[1];
    if (provider.allowedDomains?.length > 0 && !provider.allowedDomains.includes(userDomain)) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=DOMAIN_NOT_ALLOWED&domain=${encodeURIComponent(userDomain)}`, req.url)
      );
    }

    // Find or create user
    let user = await userRepository.findByEmail(mappedUser.email);

    if (!user) {
      if (!provider.autoProvision) {
        const registerUrl = new URL('/register', req.url);
        registerUrl.searchParams.set('email', mappedUser.email);
        registerUrl.searchParams.set('name', mappedUser.name);
        registerUrl.searchParams.set('surname', mappedUser.surname);
        registerUrl.searchParams.set('federated', 'true');
        registerUrl.searchParams.set('provider', provider._id?.toString() || '');
        return NextResponse.redirect(registerUrl);
      }

      // Auto-provision
      const tenantId = provider.defaultTenantId || 'GLOBAL';

      const newUserId = await userRepository.create({
        email: mappedUser.email,
        name: mappedUser.name,
        surname: mappedUser.surname || '',
        role: (mappedUser.role as unknown as string) || 'USER',
        tenantId,
        tenants: [],
        activeModules: [],
        active: true,
        mfaEnabled: false,
        mfaEnforced: false,
        loginAttempts: 0,
        preferences: {},
        password: '',
      } as unknown as Parameters<typeof userRepository.create>[0]);

      user = await userRepository.findById(newUserId);
      if (!user) {
        throw new Error('Failed to create user after auto-provisioning');
      }
    }

    await logger.audit({
      tenantId: provider.tenantId || provider.defaultTenantId || 'unknown',
      action: 'SAML_LOGIN_SUCCESS',
      entityType: 'SSO',
      entityId: entityId || 'unknown',
      userId: user._id?.toString() || 'system',
      userEmail: user.email || 'system@abd.com',
      changedFields: { providerId: provider._id?.toString(), method: 'SAML', autoProvision: !user },
    });

    // Create better-auth-compatible session via MongoDB
    const response = await setFederatedSession({
      userId: user._id?.toString() || '',
      redirectTo: relayState || '/dashboard',
      req,
    });

    return response;
  } catch (error) {
    const samlError = error instanceof Error ? error.message : 'Unknown error';
    await logger.audit({
      tenantId: 'unknown',
      action: 'SAML_ACS_ERROR',
      entityType: 'FEDERATION',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system@abd.com',
      changedFields: { error: samlError },
    });
    console.error('[SAML_ACS]', error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=SAML_ERROR&details=${encodeURIComponent((error as Error).message)}`, req.url)
    );
  }
}



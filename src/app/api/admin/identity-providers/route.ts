/**
 * @purpose Gestiona proveedores de identidad para la API administrativa, maneja operaciones de lista y creación.
 * @purpose_en Manages identity providers for the admin API, handling list and create operations.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:5,sig:1esdpx0
 * @lastUpdated 2026-06-23T22:37:28.128Z
 */

import { NextResponse } from 'next/server';
import { identityProviderRepository } from '@/lib/repositories/IdentityProviderRepository';
import { IdentityProviderSchema } from '@/lib/schemas/identity-provider';
import { FederationService } from '@/services/auth/FederationService';
import { ObjectId } from 'mongodb';

/**
 * 🔐 Identity Providers Admin API
 * GET  /api/admin/identity-providers      — List all providers
 * POST /api/admin/identity-providers      — Create a new provider
 */
export async function GET() {
  try {
    const providers = await identityProviderRepository.list();
    const serialized = providers.map(p => ({
      ...p,
      _id: p._id?.toString() || '',
      clientSecret: p.clientSecret ? '••••••••' : '', // Mask secret
    }));
    return NextResponse.json(serialized);
  } catch (error) {
    console.error('[ADMIN_IDP_LIST]', error);
    return NextResponse.json({ error: 'Failed to list identity providers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = IdentityProviderSchema.omit({ _id: true, createdAt: true, updatedAt: true }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid provider configuration',
        details: validation.error.format(),
      }, { status: 400 });
    }

    const data = validation.data;
    const id = await identityProviderRepository.create(data as unknown as Parameters<typeof identityProviderRepository.create>[0]);

    // Invalidate cache if OIDC provider
    if (data.providerType === 'OIDC' && data.issuerUrl) {
      FederationService.invalidateCache(data.issuerUrl);
    }

    return NextResponse.json({ id, success: true }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_IDP_CREATE]', error);
    return NextResponse.json({ error: 'Failed to create identity provider' }, { status: 500 });
  }
}

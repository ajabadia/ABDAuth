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
    const id = await identityProviderRepository.create(data as any);

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

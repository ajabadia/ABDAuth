import { NextResponse } from 'next/server';
import { identityProviderRepository } from '@/lib/repositories/IdentityProviderRepository';
import { connectDB } from '@ajabadia/satellite-sdk';

export const dynamic = 'force-dynamic';

/**
 * 🌐 GET /api/auth/federation/providers
 * Public endpoint that lists active identity providers for the federated login page.
 * Returns only safe-to-expose fields (no clientSecret, metadataXml, etc.)
 */
export async function GET() {
  try {
    await connectDB();

    const providers = await identityProviderRepository.list({ active: true } as any);

    const safeProviders = providers.map((p) => ({
      _id: p._id?.toString?.() ?? String(p._id),
      name: p.name,
      description: p.description ?? '',
      providerType: p.providerType,
      issuerUrl: p.issuerUrl,
      entityId: p.entityId,
    }));

    return NextResponse.json({ providers: safeProviders });
  } catch (error) {
    console.error('[FEDERATION_PROVIDERS] Failed to list providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch identity providers' },
      { status: 500 }
    );
  }
}

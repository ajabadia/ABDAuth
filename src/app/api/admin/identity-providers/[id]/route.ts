/**
 * @purpose Gestiona actualizaciones y eliminación suave para proveedores de identidad.
 * @purpose_en Handles the update and soft-delete operations for identity providers.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:5,sig:1ppo0y8
 * @lastUpdated 2026-06-23T22:37:31.946Z
 */

import { NextResponse } from 'next/server';
import { identityProviderRepository } from '@/lib/repositories/IdentityProviderRepository';
import { IdentityProviderSchema } from '@/lib/schemas/identity-provider';
import { FederationService } from '@/services/auth/FederationService';
import { ObjectId } from 'mongodb';

/**
 * 🔐 Identity Provider Detail API
 * PATCH /api/admin/identity-providers/:id  — Update provider
 * DELETE /api/admin/identity-providers/:id — Soft-delete provider
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Validate updatable fields
    const validation = IdentityProviderSchema.partial().omit({ _id: true, createdAt: true }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid update data',
        details: validation.error.format(),
      }, { status: 400 });
    }

    const success = await identityProviderRepository.update(id, {
      ...validation.data,
      updatedAt: new Date(),
    } as unknown as Parameters<typeof identityProviderRepository.update>[1]);

    if (!success) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Invalidate OIDC cache if issuer changed
    if (body.issuerUrl) {
      FederationService.invalidateCache(body.issuerUrl);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_IDP_UPDATE]', error);
    return NextResponse.json({ error: 'Failed to update identity provider' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await identityProviderRepository.softDelete(id);

    if (!success) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_IDP_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete identity provider' }, { status: 500 });
  }
}

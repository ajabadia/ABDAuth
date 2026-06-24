/**
 * @purpose Gestiona detalles y operaciones de inquilinos, como actualizar o eliminar inquilinos, restringidos al rol SUPER_ADMIN.
 * @purpose_en Manages tenant details and operations such as updating and deleting tenants, restricted to SUPER_ADMIN role.
 * @refactorable true (contains business logic for tenant management)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:8,sig:nfis18
 * @lastUpdated 2026-06-24T10:28:01.344Z
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/get-session';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { TenantSchema } from '@/lib/schemas/auth';
import { checkApiSecurity } from '@/lib/utils/api-security';
import type { IndustrialSession } from '@/types/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * 🏢 Tenant Detail Admin API
 * Restricted to SUPER_ADMIN.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const secError = checkApiSecurity(request);
  if (secError) return secError;

  const session = await getServerSession();
  const user = session?.user as unknown as IndustrialSession;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    // Partial validation for updates
    const partialSchema = TenantSchema.partial();
    const validatedData = partialSchema.parse(body);

    const success = await tenantRepository.update(new ObjectId(id), { $set: validatedData });

    if (!success) {
      return NextResponse.json({ error: 'Tenant not found or no changes made' }, { status: 404 });
    }

    // 🛡️ Industrial Audit
    await auditRepository.create({
      timestamp: new Date(),
      event: 'TENANT_UPDATED',
      actorId: user.id,
      actorEmail: user.email,
      tenantId: 'SYSTEM', // Context of update is global
      status: 'SUCCESS',
      metadata: { targetId: id, updates: validatedData }
    });

    return NextResponse.json({ message: 'Tenant updated successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Invalid data', details: errorMessage }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const secError = checkApiSecurity(_request);
  if (secError) return secError;

  const session = await getServerSession();
  const user = session?.user as unknown as IndustrialSession;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const success = await tenantRepository.softDelete(new ObjectId(id));

  if (!success) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // 🛡️ Industrial Audit
  await auditRepository.create({
    timestamp: new Date(),
    event: 'TENANT_DELETED',
    actorId: user.id,
    actorEmail: user.email,
    tenantId: 'SYSTEM',
    status: 'SUCCESS',
    metadata: { targetId: id }
  });

  return NextResponse.json({ message: 'Tenant deactivated successfully' });
}

/**
 * @purpose Gestiona solicitudes PATCH y DELETE para actualizar y eliminar aplicaciones.
 * @purpose_en Manages PATCH and DELETE requests for updating and deleting applications.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:3,imports:7,sig:4ptl4q
 * @lastUpdated 2026-06-30T14:20:21.300Z
 */

import { NextResponse } from 'next/server';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { getServerSession } from '@/lib/get-session';
import { ApplicationSchema } from '@/lib/schemas/auth';
import { checkApiSecurity } from '@/lib/utils/api-security';
import { assertAccess } from '@/lib/abac';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const secError = checkApiSecurity(req);
  if (secError) return secError;

  const session = await getServerSession();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await assertAccess({ userId: session.user.id, tenantId: session.user.tenantId, resource: 'application', action: 'update' });

  try {
    const { id } = await params;
    const body = await req.json();
    
    // Partial validation for updates
    const validated = ApplicationSchema.partial().parse({
      ...body,
      updatedAt: new Date(),
    });

    const success = await applicationRepository.update(new ObjectId(id), validated);
    if (!success) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const secError = checkApiSecurity(req);
  if (secError) return secError;

  const session = await getServerSession();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await assertAccess({ userId: session.user.id, tenantId: session.user.tenantId, resource: 'application', action: 'delete' });

  try {
    const { id } = await params;
    const success = await applicationRepository.softDelete(new ObjectId(id));
    if (!success) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

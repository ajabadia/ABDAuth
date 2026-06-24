/**
 * @purpose Gestiona el proceso de actualización para un usuario en la aplicación ABDSuite, incluyendo cifrado de contraseñas y registro de auditoría.
 * @purpose_en Handles the update operation for a user in the ABDSuite application, including password hashing and audit logging.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:y00f7q
 * @lastUpdated 2026-06-21T10:11:40.505Z
 */

import { NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import * as argon2 from 'argon2';

export async function updateUserHandler(payload: Record<string, unknown>, adminUser: { id: string; email: string; tenantId: string; role: string }): Promise<NextResponse> {
  const { _id, password, ...rest } = payload;
  if (!_id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  const existingUser = await userRepository.findById(_id as string);
  if (!existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let finalTenantId = (rest.tenantId as string) || existingUser.tenantId;
  let finalTenants = (rest.tenants as Record<string, unknown>[]) || existingUser.tenants || [];

  if (adminUser.role !== 'SUPER_ADMIN') {
    finalTenantId = existingUser.tenantId;
    const adminTenantId = adminUser.tenantId;
    const incomingMembership = ((rest.tenants as Record<string, unknown>[]) || []).find(
      t => t.tenantId === adminTenantId,
    );
    const preservedTenants = (existingUser.tenants || []).filter(
      t => t.tenantId !== adminTenantId,
    );
    finalTenants = incomingMembership ? [...preservedTenants, incomingMembership] : existingUser.tenants || [];
  }

  const finalTenantIds = Array.from(new Set([
    finalTenantId,
    ...finalTenants.map(t => t.tenantId as string),
  ].filter(Boolean)));

  const updateData: Record<string, unknown> = {
    ...rest,
    tenantId: finalTenantId,
    tenants: finalTenants,
    tenantIds: finalTenantIds,
    updatedAt: new Date(),
  };

  if (rest.mfaEnforced !== undefined) {
    if (rest.mfaEnforced && !existingUser.mfaEnforced && !existingUser.mfaEnabled) {
      updateData.mfaGracePeriodActive = true;
      updateData.mfaGraceLoginsRemaining = 3;
      updateData.mfaGraceExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (!rest.mfaEnforced) {
      updateData.mfaGracePeriodActive = false;
      updateData.mfaGraceLoginsRemaining = 0;
      updateData.mfaGraceExpiresAt = null;
    }
  }

  if (password) {
    updateData.password = await argon2.hash(password as string);
  }

  await userRepository.update(_id as string, updateData);

  await auditRepository.create({
    timestamp: new Date(),
    event: 'USER_UPDATED',
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    tenantId: adminUser.tenantId,
    status: 'SUCCESS',
    metadata: {
      targetUserId: _id,
      updatedFields: Object.keys(rest),
    },
  });

  return NextResponse.json({ success: true });
}

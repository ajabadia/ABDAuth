/**
 * @purpose Gestiona la creación de un nuevo usuario, incluyendo cifrado de contraseñas, asignación de inquilinos y envío de correos electrónicos de verificación.
 * @purpose_en Handles the creation of a new user, including password hashing, tenant assignment, and sending verification emails.
 * @refactorable true (contains business logic and side effects)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:8,sig:1f75bq4
 * @lastUpdated 2026-06-21T10:11:05.412Z
 */

import { NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { EmailService } from '@/services/email/EmailService';
import { resetTokenRepository } from '@/lib/repositories/ResetTokenRepository';
import * as argon2 from 'argon2';
import crypto from 'crypto';
import type { User } from '@/lib/schemas/user';

export async function createUserHandler(payload: Record<string, unknown>, adminUser: { id: string; email: string; tenantId: string; role: string }): Promise<NextResponse> {
  const targetTenantId = adminUser.role === 'SUPER_ADMIN' ? payload.tenantId : adminUser.tenantId;
  const initialTenants = (payload.tenants as Record<string, unknown>[]) || [];
  const resolvedTenants = initialTenants.length === 0 && targetTenantId
    ? [{
        tenantId: targetTenantId,
        role: payload.role === 'ADMIN' ? 'admin' : (payload.role === 'SUPER_ADMIN' ? 'owner' : 'student'),
        status: 'active',
        allowedApps: (payload.allowedApps as string[]) || [],
      }]
    : initialTenants;

  const initialTenantIds = Array.from(new Set([
    targetTenantId as string,
    ...resolvedTenants.map(t => t.tenantId as string),
  ].filter(Boolean)));

  const newUser: Record<string, unknown> = {
    ...payload,
    tenantId: targetTenantId,
    tenants: resolvedTenants,
    tenantIds: initialTenantIds,
    createdAt: new Date(),
    updatedAt: new Date(),
    mfaEnabled: false,
    active: false,
    mfaGracePeriodActive: !!payload.mfaEnforced,
    mfaGraceLoginsRemaining: payload.mfaEnforced ? 3 : 0,
    mfaGraceExpiresAt: payload.mfaEnforced ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
  };

  if (adminUser.role !== 'SUPER_ADMIN' && (newUser.role as string) === 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Cannot escalate privileges' }, { status: 403 });
  }

  newUser.password = await argon2.hash(crypto.randomBytes(20).toString('hex'));

  const created = await userRepository.create(newUser as unknown as User);

  const token = crypto.randomBytes(32).toString('hex');
  await resetTokenRepository.create({
    userId: created,
    token,
    expiresAt: new Date(Date.now() + 86400000 * 7),
    createdAt: new Date(),
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:5001';
  const verificationUrl = `${baseUrl}/login/reset-password?token=${token}`;

  try {
    await EmailService.sendVerificationEmail({
      to: newUser.email as string,
      userName: (newUser.name as string) || (newUser.email as string).split('@')[0],
      verificationUrl,
    });

    await auditRepository.create({
      timestamp: new Date(),
      event: 'USER_CREATED',
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      tenantId: adminUser.tenantId,
      status: 'SUCCESS',
      metadata: { targetUserId: created, invitationSent: true },
    });
  } catch (emailErr) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is missing. Emails will not be sent.');
    }
    console.error('Failed to send verification email:', emailErr);
  }

  return NextResponse.json(created, { status: 201 });
}

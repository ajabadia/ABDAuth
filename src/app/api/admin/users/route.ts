import { NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { EmailService } from '@/services/email/EmailService';
import { resetTokenRepository } from '@/lib/repositories/ResetTokenRepository';
import { IndustrialNormalizer } from '@/lib/utils/IndustrialNormalizer';
import { validateAdminSession } from '@/lib/utils/api-auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * 👥 Hierarchical User Management API
 * Supports SuperAdmin global view and TenantAdmin delegated view.
 */
export async function GET() {
  try {
    const { authorized, user, response } = await validateAdminSession();
    if (!authorized) return response!;

    const users = await userRepository.listForSession(user!);
    
    // Sanitize and Normalize sensitive data before sending to UI
    const sanitizedUsers = users.map(u => {
      const normalized = IndustrialNormalizer.normalizeUser(u);
      const { password: _p, ...safeUser } = normalized;
      return safeUser;
    });

    return NextResponse.json(sanitizedUsers);
  } catch {
    return NextResponse.json({ error: 'Internal User Sync Failure' }, { status: 500 });
  }
}

/**
 * 🆕 Create Industrial User
 */
export async function POST(request: Request) {
  try {
    const { authorized, user, response } = await validateAdminSession();
    if (!authorized) return response!;

    const payload = await request.json();

    // 🛡️ Security Enforcement
    const newUser = {
      ...payload,
      tenantId: user!.role === 'SUPER_ADMIN' ? payload.tenantId : user!.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      mfaEnabled: false,
      active: false, // Pending activation
    };

    if (user!.role !== 'SUPER_ADMIN' && newUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot escalate privileges' }, { status: 403 });
    }

    // Set a random impossible password for now
    newUser.password = await bcrypt.hash(crypto.randomBytes(20).toString('hex'), 12);

    const created = await userRepository.create(newUser);

    // 🔑 Generate Activation Token (reusing reset token infrastructure)
    const token = crypto.randomBytes(32).toString('hex');
    await resetTokenRepository.create({
      userId: created,
      token,
      expiresAt: new Date(Date.now() + 86400000 * 7),
      createdAt: new Date(),
    });

    // 📧 Dispatch Activation Email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3400';
    const verificationUrl = `${baseUrl}/login/reset-password?token=${token}`;
    
    try {
      await EmailService.sendVerificationEmail({
        to: newUser.email,
        userName: newUser.name || newUser.email.split('@')[0],
        verificationUrl,
      });

      await auditRepository.create({
        timestamp: new Date(),
        event: 'USER_CREATED',
        actorId: user!.id,
        actorEmail: user!.email,
        tenantId: user!.tenantId,
        status: 'SUCCESS',
        metadata: { targetUserId: created, invitationSent: true }
      });
    } catch (emailErr) {
      if (!process.env.RESEND_API_KEY) {
        // eslint-disable-next-line no-console
        console.warn("RESEND_API_KEY is missing. Emails will not be sent.");
      }
      // eslint-disable-next-line no-console
      console.error('Failed to send verification email:', emailErr);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json({ error: 'Failed to create industrial user' }, { status: 500 });
  }
}

/**
 * 🔄 Update Industrial User
 */
export async function PUT(request: Request) {
  try {
    const { authorized, user, response } = await validateAdminSession();
    if (!authorized) return response!;

    const { _id, password, ...payload } = await request.json();
    if (!_id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const updateData: Record<string, unknown> = {
      ...payload,
      updatedAt: new Date(),
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await userRepository.update(_id, updateData);

    // 🗝️ Critical: If admin is editing THEMSELVES, synchronize the session
    if (_id === user!.id) {
      const { unstable_update } = await import('@/auth');
      await unstable_update({
        user: {
          ...user!,
          ...payload,
          mfaEnforced: !!payload.mfaEnforced
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update industrial user' }, { status: 500 });
  }
}

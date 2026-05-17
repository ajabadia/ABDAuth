import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { EmailService } from '@/services/email/EmailService';
import { resetTokenRepository } from '@/lib/repositories/ResetTokenRepository';
import type { IndustrialSession } from '@/types/auth';
import { IndustrialNormalizer } from '@/lib/utils/IndustrialNormalizer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * 👥 Hierarchical User Management API
 * Supports SuperAdmin global view and TenantAdmin delegated view.
 */
export async function GET() {
  try {
    const session = await auth() as unknown as { user: IndustrialSession };

    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 });
    }

    const users = await userRepository.listForSession(session.user);
    
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
    const session = await auth() as unknown as { user: IndustrialSession };
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 });
    }

    const payload = await request.json();

    // 🛡️ Security Enforcement
    const newUser = {
      ...payload,
      tenantId: session.user.role === 'SUPER_ADMIN' ? payload.tenantId : session.user.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      mfaEnabled: false,
      active: false, // Pending activation
    };

    if (session.user.role !== 'SUPER_ADMIN' && newUser.role === 'SUPER_ADMIN') {
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
      actorId: session.user.id,
      actorEmail: session.user.email,
      tenantId: session.user.tenantId,
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
    const session = await auth() as unknown as { user: IndustrialSession };
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 });
    }

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
    if (_id === session.user.id) {
      const { unstable_update } = await import('@/auth');
      await unstable_update({
        user: {
          ...session.user,
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

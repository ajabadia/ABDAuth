import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userRepository } from '@/lib/repositories/UserRepository';
import type { IndustrialSession } from '@/types/auth';
import bcrypt from 'bcryptjs';

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

    // listForSession handles the tenantId isolation automatically
    const users = await userRepository.listForSession(session.user);
    
    // Sanitize sensitive data before sending to UI
    const sanitizedUsers = users.map(u => {
      const { password: _p, ...safeUser } = u;
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
      // Force tenantId if not SuperAdmin
      tenantId: session.user.role === 'SUPER_ADMIN' ? payload.tenantId : session.user.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Prevent TenantAdmin from creating SuperAdmins
    if (session.user.role !== 'SUPER_ADMIN' && newUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot escalate privileges' }, { status: 403 });
    }

    // Hash password if provided
    if (newUser.password) {
      newUser.password = await bcrypt.hash(newUser.password, 10);
    }

    const created = await userRepository.create(newUser);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create industrial user' }, { status: 500 });
  }
}

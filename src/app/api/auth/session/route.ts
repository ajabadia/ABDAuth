import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { IndustrialSession } from '@/types/auth';

/**
 * 🛰️ SSO Session Verification API
 * This endpoint allows satellite projects (ABDQuiz, ABDAgRAG) to verify 
 * the current session and retrieve industrial identity claims.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = session.user as unknown as IndustrialSession;

    // Return the authorized identity context
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      expires: session.expires
    });
  } catch {
    return NextResponse.json({ error: 'Internal Identity Failure' }, { status: 500 });
  }
}

/**
 * @purpose Gestiona la verificación y el retiro de reclamaciones de identidad industrial para proyectos satelitales.
 * @purpose_en Handles the verification and retrieval of industrial identity claims for satellite projects.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:167xfha
 * @lastUpdated 2026-06-23T22:39:03.344Z
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/get-session';
import type { IndustrialSession } from '@/types/auth';

/**
 * 🛰️ SSO Session Verification API
 * This endpoint allows satellite projects (ABDQuiz, ABDAgRAG) to verify 
 * the current session and retrieve industrial identity claims.
 */
export async function GET() {
  try {
    const session = await getServerSession();

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
      expires: session.session.expiresAt
    });
  } catch {
    return NextResponse.json({ error: 'Internal Identity Failure' }, { status: 500 });
  }
}

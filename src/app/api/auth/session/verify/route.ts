/**
 * @purpose Valida si la identidad federada del usuario está activa y saludable en vivo, apoyando SLO por canal de retroalimentación mediante autenticación con token de portador.
 * @purpose_en Validates if a user's federated identity is active and healthy in vivo, supporting back-channel SLO via bearer token authentication.
 * @refactorable true (contains business logic and async operations)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:xgehsp
 * @lastUpdated 2026-06-25T10:16:00.966Z
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from '@ajabadia/satellite-sdk/logger';;
import { userRepository } from "@/lib/repositories/UserRepository";
import { applicationRepository } from "@/lib/repositories/ApplicationRepository";
import { SessionService } from "@/services/auth/SessionService";

/**
 * 🔒 Session Verification API Endpoint (ABDAuth)
 * Validates if a user's federated identity is active and healthy in vivo.
 * Secured via bearer token using client secret to prevent database discovery.
 *
 * Supports back-channel SLO: if sessionId is provided, validates against
 * the persistent sessions DB to detect remotely revoked sessions.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const sessionId = searchParams.get("sessionId");

  if (!email) {
    return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
  }

  // 🛡️ Security Check: Validate authorization header against client secret
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientSecret = authHeader.substring(7); // Extract token from "Bearer "
  const app = await applicationRepository.findOne({ clientSecret, active: true } as Record<string, unknown>);

  if (!app) {
    const expectedSecret = process.env.AUTH_CLIENT_SECRET || "abdquiz-industrial-client-secret";
    if (clientSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }


  try {
    const user = await userRepository.findByEmail(email);

    // Check if user exists, is active, and is not locked out
    if (!user) {
      return NextResponse.json({ active: false, reason: "USER_NOT_FOUND" });
    }

    if (!user.active) {
      return NextResponse.json({ active: false, reason: "ACCOUNT_INACTIVE" });
    }

    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      return NextResponse.json({ active: false, reason: "ACCOUNT_LOCKED" });
    }

    // 🔐 Back-channel SLO: validate persistent session if sessionId was provided
    if (sessionId) {
      const tenantIdToValidate = user.role === "SUPER_ADMIN" ? "GLOBAL" : user.tenantId;
      const isSessionActive = await SessionService.validateSession(sessionId, tenantIdToValidate);
      if (!isSessionActive) {
        return NextResponse.json({ active: false, reason: "SESSION_REVOKED" });
      }
    }

    // Account is completely active and healthy!
    return NextResponse.json({
      active: true,
      user: {
        id: user._id?.toString(),
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    const verifyError = error instanceof Error ? error.message : 'Unknown error';
    await logger.audit({
      tenantId: 'unknown',
      action: 'SESSION_VERIFY_API_ERROR',
      entityType: 'USER',
      entityId: email || 'unknown',
      userId: 'system',
      userEmail: email || 'system@abd.com',
      changedFields: { error: verifyError, email },
    });
    console.error("[SESSION_VERIFY_API_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

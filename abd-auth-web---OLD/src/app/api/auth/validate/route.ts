import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { IndustrialSession } from "@/types/auth";

/**
 * 🔒 Cross-Project Validation Endpoint
 * GET /api/auth/validate
 * 
 * Used by ABDAgRAG and ABDQuiz to verify industrial identity.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { authenticated: false, error: "UNAUTHORIZED_SESSION" },
        { status: 401 }
      );
    }

    const user = session.user as unknown as IndustrialSession;

    // Return sanitized industrial claims
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      timestamp: new Date().toISOString(),
      system: "ABDAuth_Industrial_Core"
    });

  } catch {
    // Validation error silenced for industrial purity.
    return NextResponse.json(
      { authenticated: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

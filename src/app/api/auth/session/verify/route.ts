import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/repositories/UserRepository";

/**
 * 🔒 Session Verification API Endpoint (ABDAuth)
 * Validates if a user's federated identity is active and healthy in vivo.
 * Secured via bearer token using client secret to prevent database discovery.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
  }

  // 🛡️ Security Check: Validate authorization header against client secret
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.AUTH_CLIENT_SECRET || "abdquiz-industrial-client-secret";

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    console.error("[SESSION_VERIFY_API_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

'use server'

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  console.log("[LOGIN_ACTION_START] Email:", email);

  try {
    const { RateLimitService } = await import('@/services/security/RateLimitService');
    const ip = await RateLimitService.getClientIp();
    
    console.log("[LOGIN_ACTION_IP] Client IP:", ip);

    // 🛡️ Volumetric Protection: 10 login attempts per 1 minute per IP
    const isAllowed = await RateLimitService.check(ip, 'login', 10, 60);
    console.log("[LOGIN_ACTION_RATE_LIMIT] Allowed?", isAllowed);
    if (!isAllowed) {
      return { error: 'TOO_MANY_REQUESTS' };
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false, // Handle redirect in the client or via throw
    });
    
    console.log("[LOGIN_ACTION_SUCCESS] Signed in successfully.");
  } catch (error) {
    console.error("[LOGIN_ACTION_CRITICAL_ERROR]", error);
    if (error instanceof AuthError) {
      // 🛡️ Industrial Error Mapping
      if (error.cause?.err?.message === 'ACCOUNT_LOCKED') return { error: 'ACCOUNT_LOCKED' };
      if (error.cause?.err?.message === 'ACCOUNT_INACTIVE') return { error: 'ACCOUNT_INACTIVE' };
      return { error: 'Invalid credentials' };
    }
    // Re-throw redirect errors so Next.js handles them
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || (error as { digest?: string }).digest?.includes('NEXT_REDIRECT'))) {
      throw error;
    }
    // Handle other errors
    return { error: 'Something went wrong' };
  }
}

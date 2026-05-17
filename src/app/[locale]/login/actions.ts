'use server'

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { RateLimitService } = await import('@/services/security/RateLimitService');
  const ip = await RateLimitService.getClientIp();
  
  // 🛡️ Volumetric Protection: 10 login attempts per 1 minute per IP
  const isAllowed = await RateLimitService.check(ip, 'login', 10, 60);
  if (!isAllowed) {
    return { error: 'TOO_MANY_REQUESTS' };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false, // Handle redirect in the client or via throw
    });
  } catch (error) {
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

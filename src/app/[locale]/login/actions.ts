/**
 * @purpose Gestiona acciones de inicio de sesión del usuario, incluyendo autenticación, limitación de tasas y verificación de bloqueo de cuenta.
 * @purpose_en Manages user login actions, including authentication, rate limiting, and account lockout checks.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:7,sig:v1hl9b
 * @lastUpdated 2026-06-26T09:59:18.803Z
 */

'use server'

import { auth } from "@/lib/auth";
import { APIError } from "better-auth";
import { userRepository } from "@/lib/repositories/UserRepository";
import { logger } from '@ajabadia/satellite-sdk/logger';
import { cookies, headers } from 'next/headers';
import { SsoService } from '@/services/auth/SsoService';
import type { SsoPayload } from '@/services/auth/types/sso-payload';

interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  surname?: string | null;
  role?: string | null;
  tenantId?: string | null;
  permissions?: string[] | null;
  dbPrefix?: string | null;
  isolationStrategy?: string | null;
  allowedApps?: string[] | null;
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  if (process.env.NODE_ENV === 'development') {
    console.log("[LOGIN_ACTION_START] Login attempt started.");
  }

  try {
    const { RateLimitService } = await import('@/services/security/RateLimitService');
    const ip = await RateLimitService.getClientIp();

    if (process.env.NODE_ENV === 'development') {
      console.log("[LOGIN_ACTION_IP] Client IP:", ip);
    }

    // 🛡️ Volumetric Protection: 10 login attempts per 1 minute per IP
    const isAllowed = await RateLimitService.check(ip, 'login', 10, 60);
    if (process.env.NODE_ENV === 'development') {
      console.log("[LOGIN_ACTION_RATE_LIMIT] Allowed?", isAllowed);
    }
    if (!isAllowed) {
      return { error: 'TOO_MANY_REQUESTS' };
    }

    // 🛡️ Account Lockout Guard: Check before calling Better Auth
    const dbUser = await userRepository.findByEmail(email);
    if (dbUser && dbUser.lockoutUntil && new Date(dbUser.lockoutUntil) > new Date()) {
      return { error: 'ACCOUNT_LOCKED' };
    }

    // 🔐 Authenticate via better-auth
    const signInResult = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log("[LOGIN_ACTION_SUCCESS] Signed in successfully.");
    }

    // 🛡️ Generate abd_session JWT for satellite middleware using helper
    await setAbdSessionCookie(signInResult.user);

    return {};
  } catch (error) {
    const loginError = error instanceof Error ? error.message : 'Unknown error';
    await logger.audit({
      tenantId: 'unknown',
      action: 'LOGIN_ACTION_CRITICAL_ERROR',
      entityType: 'USER',
      entityId: email,
      userId: 'system',
      userEmail: email || 'unknown@abd.com',
      changedFields: { error: loginError, email },
    });
    console.error("[LOGIN_ACTION_CRITICAL_ERROR]", error);

    // 🔢 Increment login attempts on any authentication failure
    try {
      const failedUser = await userRepository.findByEmail(email);
      if (failedUser) {
        const newAttempts = (failedUser.loginAttempts || 0) + 1;
        const updateData: Record<string, unknown> = { loginAttempts: newAttempts };
        if (newAttempts >= 5) {
          updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
        }
        await userRepository.update(failedUser._id as string, updateData);
      }
    } catch (incrementError) {
      const incMsg = incrementError instanceof Error ? incrementError.message : 'Unknown error';
      await logger.audit({
        tenantId: 'unknown',
        action: 'LOGIN_INCREMENT_ATTEMPTS_ERROR',
        entityType: 'USER',
        entityId: email,
        userId: 'system',
        userEmail: email || 'unknown@abd.com',
        changedFields: { error: incMsg, email },
      });
      console.error("[LOGIN_ACTION] Failed to increment login attempts:", incrementError);
    }

    if (error instanceof APIError) {
      if (error.status === 403) {
        const message = error.message?.toLowerCase() || '';
        if (message.includes('locked') || message.includes('account_locked')) {
          return { error: 'ACCOUNT_LOCKED' };
        }
        if (message.includes('inactive') || message.includes('account_inactive')) {
          return { error: 'ACCOUNT_INACTIVE' };
        }
      }
      return { error: 'Invalid credentials' };
    }

    // Re-throw redirect errors so Next.js handles them
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || (error as { digest?: string }).digest?.includes('NEXT_REDIRECT'))) {
      throw error;
    }

    return { error: 'Something went wrong' };
  }
}

async function setAbdSessionCookie(user: SessionUser) {
  const ssoPayload: SsoPayload = {
    sub: user.id,
    email: user.email,
    name: user.name || '',
    surname: user.surname || '',
    role: user.role || 'USER',
    tenantId: user.tenantId || 'GLOBAL',
    permissions: user.permissions || [],
    dbPrefix: user.dbPrefix || '',
    isolationStrategy: user.isolationStrategy || 'COLLECTION_PREFIX',
    allowedApps: user.allowedApps || [],
  };
  const abdToken = await SsoService.generateToken(ssoPayload);
  const cookieStore = await cookies();
  cookieStore.set('abd_session', abdToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 2,
  });
}

export async function verifyMfaAction(code: string) {
  let user: SessionUser;

  try {
    const result = await auth.api.verifyTOTP({
      body: { code },
      headers: await headers(),
    });
    user = result.user;
  } catch (error) {
    if (error instanceof APIError) {
      return { error: 'INVALID_CODE' };
    }
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || (error as { digest?: string }).digest?.includes('NEXT_REDIRECT'))) {
      throw error;
    }
    console.error("[VERIFY_MFA_ERROR]", error);
    return { error: 'VERIFICATION_FAILED' };
  }

  try {
    await setAbdSessionCookie(user);
  } catch (cookieError) {
    console.error("[VERIFY_MFA_COOKIE_ERROR]", cookieError);
    return { error: 'SESSION_CREATION_FAILED' };
  }

  return { success: true };
}

export async function verifyBackupCodeAction(code: string) {
  let user: SessionUser;

  try {
    const result = await auth.api.verifyBackupCode({
      body: { code },
      headers: await headers(),
    });
    if (!result.user) return { error: 'INVALID_CODE' };
    user = result.user;
  } catch (error) {
    if (error instanceof APIError) {
      return { error: 'INVALID_CODE' };
    }
    if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || (error as { digest?: string }).digest?.includes('NEXT_REDIRECT'))) {
      throw error;
    }
    console.error("[VERIFY_BACKUP_CODE_ERROR]", error);
    return { error: 'VERIFICATION_FAILED' };
  }

  try {
    await setAbdSessionCookie(user);
  } catch (cookieError) {
    console.error("[VERIFY_BACKUP_CODE_COOKIE_ERROR]", cookieError);
    return { error: 'SESSION_CREATION_FAILED' };
  }

  return { success: true };
}

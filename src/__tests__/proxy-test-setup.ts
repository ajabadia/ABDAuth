/**
 * @purpose Gestiona y exporta funciones útiles para configurar pruebas de proxy en la aplicación ABDAuth.
 * @purpose_en Manages and exports utility functions for setting up proxy tests in the ABDAuth application.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:1nb5g2d
 * @lastUpdated 2026-06-25T10:18:16.385Z
 */

import { vi } from 'vitest';

vi.mock('@ajabadia/satellite-sdk/core', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    verifyToken: vi.fn(async (token: string) => {
      try {
        return JSON.parse(token);
      } catch {
        return null;
      }
    }),
  };
});

// ── Shared proxy test helpers ─────────────────────────────
// Note: vi.mock + vi.hoisted MUST stay in each test file because
// Vitest can't hoist across file boundaries.

export const mockIntlMiddlewareResult = { status: 200, intl: true };

export function makeReq(mockGetSession: ReturnType<typeof vi.fn>) {
  return (pathname: string, sessionData: any = null, queryParams = '') => {
    const baseUrl = 'http://localhost:5001';
    const urlStr = `${baseUrl}${pathname}${queryParams}`;
    const searchParams = new URLSearchParams(queryParams.replace(/^\?/, ''));
    mockGetSession.mockResolvedValue(sessionData);

    const tokenValue = sessionData?.user ? JSON.stringify({
      sub: sessionData.user.id || 'u1',
      email: sessionData.user.email || 'user@example.com',
      name: sessionData.user.name || 'Test',
      surname: sessionData.user.surname || 'User',
      role: sessionData.user.role || 'USER',
      tenantId: sessionData.user.tenantId || 'global',
      permissions: sessionData.user.permissions || [],
      dbPrefix: 'abd_global',
      isolationStrategy: 'COLLECTION_PREFIX',
      allowedApps: sessionData.user.allowedApps || ['quiz', 'analytics', 'logs', 'files'],
      mfaEnabled: typeof sessionData.user.mfaEnabled === 'boolean' ? sessionData.user.mfaEnabled : false,
      mfaEnforced: typeof sessionData.user.mfaEnforced === 'boolean' ? sessionData.user.mfaEnforced : false,
      mfa_verified: typeof sessionData.user.mfa_verified === 'boolean' ? sessionData.user.mfa_verified : false,
    }) : '';

    return {
      url: urlStr,
      nextUrl: { pathname, searchParams },
      cookies: {
        set: vi.fn(),
        get: vi.fn((name) => {
          if (name === 'abd_session' && tokenValue) {
            return { value: tokenValue };
          }
          return undefined;
        }),
      },
      headers: new Headers(),
    } as unknown as any;
  };
}


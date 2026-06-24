/**
 * @purpose Gestiona y exporta funciones útiles para configurar pruebas de proxy en la aplicación ABDAuth.
 * @purpose_en Manages and exports utility functions for setting up proxy tests in the ABDAuth application.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:16kv1vj
 * @lastUpdated 2026-06-21T14:25:46.814Z
 */

import { vi } from 'vitest';

// ── Shared proxy test helpers ─────────────────────────────
// Note: vi.mock + vi.hoisted MUST stay in each test file because
// Vitest can't hoist across file boundaries.

export const mockIntlMiddlewareResult = { status: 200, intl: true };

export function makeReq(mockGetSession: ReturnType<typeof vi.fn>) {
  return (pathname: string, sessionData: unknown = null, queryParams = '') => {
    const baseUrl = 'http://localhost:5001';
    const urlStr = `${baseUrl}${pathname}${queryParams}`;
    const searchParams = new URLSearchParams(queryParams.replace(/^\?/, ''));
    mockGetSession.mockResolvedValue(sessionData);
    return {
      url: urlStr,
      nextUrl: { pathname, searchParams },
      cookies: { set: vi.fn() },
      headers: new Headers(),
    } as unknown as any;
  };
}

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

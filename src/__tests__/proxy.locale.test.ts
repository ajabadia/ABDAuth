import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks must be in the same file for proper hoisting ──
const mockGetSession = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock('../i18n/routing', () => ({
  routing: { locales: ['es', 'en'], defaultLocale: 'es', localePrefix: 'always' },
}));

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => vi.fn(() => ({ status: 200, intl: true }))),
}));

vi.mock('next/server', () => {
  const mockCookies = {
    set: vi.fn(),
    get: vi.fn(),
  };
  return {
    NextResponse: {
      redirect: vi.fn((url) => ({
        status: 307,
        headers: { Location: url.toString() },
        redirectUrl: url.toString(),
        cookies: mockCookies,
      })),
      next: vi.fn(() => ({
        status: 200,
        next: true,
        cookies: mockCookies,
      })),
    },
  };
});

// ── Shared helpers ───────────────────────────────────────
import { makeReq, mockIntlMiddlewareResult } from './proxy-test-setup';

import proxy from '../proxy';
import createMiddleware from 'next-intl/middleware';

const mockIntlMiddleware = vi.mocked(createMiddleware).mock.results[0].value;

const runProxy = async (req: unknown) => (proxy as unknown as any)(req);
const req = makeReq(mockGetSession);

describe('Proxy: Locale & Landing Page Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass root "/" to intlMiddleware', async () => {
    const r = req('/');
    const res = await runProxy(r);
    expect(mockIntlMiddleware).toHaveBeenCalledWith(r);
    expect(res).toEqual(mockIntlMiddlewareResult);
  });

  it('should pass locale roots like "/es" or "/en" to intlMiddleware', async () => {
    const rEs = req('/es');
    const resEs = await runProxy(rEs);
    expect(mockIntlMiddleware).toHaveBeenCalledWith(rEs);
    expect(resEs).toEqual(mockIntlMiddlewareResult);

    const rEn = req('/en');
    const resEn = await runProxy(rEn);
    expect(mockIntlMiddleware).toHaveBeenCalledWith(rEn);
    expect(resEn).toEqual(mockIntlMiddlewareResult);
  });
});

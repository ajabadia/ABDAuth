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

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: vi.fn((url) => ({ status: 307, headers: { Location: url.toString() }, redirectUrl: url.toString() })),
    next: vi.fn(() => ({ status: 200, next: true })),
  },
}));

// ── Shared helpers ───────────────────────────────────────
import { makeReq, mockIntlMiddlewareResult } from './proxy-test-setup';

import proxy from '../proxy';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

const mockIntlMiddleware = vi.mocked(createMiddleware).mock.results[0].value;

const runProxy = async (req: unknown) => (proxy as unknown as any)(req);
const req = makeReq(mockGetSession);

describe('Proxy: MFA Setup and Enrollment Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to "/login/mfa" when user is logged in, MFA enabled but not verified', async () => {
    const r = req('/es/dashboard', {
      user: { id: 'user-1', role: 'USER', mfaEnabled: true, mfa_verified: false },
    });
    const res = await runProxy(r);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: 'http://localhost:3400/es/login/mfa' })
    );
    expect(res.redirectUrl).toBe('http://localhost:3400/es/login/mfa');
  });

  it('should redirect to "/login/mfa/setup" when MFA is enforced but not enabled', async () => {
    const r = req('/en/dashboard', {
      user: { id: 'user-1', role: 'USER', mfaEnforced: true, mfaEnabled: false },
    });
    const res = await runProxy(r);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: 'http://localhost:3400/en/login/mfa/setup' })
    );
    expect(res.redirectUrl).toBe('http://localhost:3400/en/login/mfa/setup');
  });

  it('should not redirect if already on MFA pages to prevent loops', async () => {
    const r = req('/es/login/mfa', {
      user: { id: 'user-1', role: 'USER', mfaEnabled: true, mfa_verified: false },
    });
    const res = await runProxy(r);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
});

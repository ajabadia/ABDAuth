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

describe('Proxy: Public Routes (Login/Register)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login page for unauthenticated users', async () => {
    const r = req('/es/login');
    const res = await runProxy(r);
    expect(mockIntlMiddleware).toHaveBeenCalledWith(r);
    expect(res).toEqual(mockIntlMiddlewareResult);
  });

  it('should redirect to callbackUrl when authenticated user hits login', async () => {
    const r = req('/es/login', { user: { id: 'u1' } }, '?callbackUrl=http://localhost:5020/exams');
    const res = await runProxy(r);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: 'http://localhost:5020/exams' })
    );
    expect(res.redirectUrl).toBe('http://localhost:5020/exams');
  });

  it('should redirect to dashboard when authenticated user hits login without callbackUrl', async () => {
    const r = req('/en/login', { user: { id: 'u1' } });
    const res = await runProxy(r);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: 'http://localhost:5001/en/dashboard' })
    );
    expect(res.redirectUrl).toBe('http://localhost:5001/en/dashboard');
  });
});

describe('Proxy: Dashboard Route Protection & RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to "/login" if unauthenticated user attempts to access dashboard', async () => {
    const r = req('/es/dashboard');
    const res = await runProxy(r);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: 'http://localhost:5001/es/login' })
    );
  });

  it('should allow normal dashboard access for authenticated users', async () => {
    const r = req('/es/dashboard', { user: { id: 'u1', role: 'USER' } });
    const res = await runProxy(r);
    expect(mockIntlMiddleware).toHaveBeenCalledWith(r);
    expect(res).toEqual(mockIntlMiddlewareResult);
  });

  it('should deny "/dashboard/tenants" for ADMIN and USER roles', async () => {
    let r = req('/es/dashboard/tenants', { user: { id: 'u1', role: 'ADMIN' } });
    let res = await runProxy(r);
    expect(res.redirectUrl).toBe('http://localhost:5001/es/dashboard');

    r = req('/es/dashboard/tenants', { user: { id: 'u1', role: 'USER' } });
    res = await runProxy(r);
    expect(res.redirectUrl).toBe('http://localhost:5001/es/dashboard');
  });

  it('should allow "/dashboard/tenants" for SUPER_ADMIN role', async () => {
    const r = req('/es/dashboard/tenants', { user: { id: 'u1', role: 'SUPER_ADMIN' } });
    const res = await runProxy(r);
    expect(mockIntlMiddleware).toHaveBeenCalledWith(r);
    expect(res).toEqual(mockIntlMiddlewareResult);
  });

  it('should deny "/dashboard/users" and "/dashboard/audit" for USER role', async () => {
    let r = req('/es/dashboard/users', { user: { id: 'u1', role: 'USER' } });
    let res = await runProxy(r);
    expect(res.redirectUrl).toBe('http://localhost:5001/es/dashboard');

    r = req('/es/dashboard/audit', { user: { id: 'u1', role: 'USER' } });
    res = await runProxy(r);
    expect(res.redirectUrl).toBe('http://localhost:5001/es/dashboard');
  });

  it('should allow "/dashboard/users" and "/dashboard/audit" for ADMIN and SUPER_ADMIN', async () => {
    let r = req('/es/dashboard/users', { user: { id: 'u1', role: 'ADMIN' } });
    let res = await runProxy(r);
    expect(res).toEqual(mockIntlMiddlewareResult);

    r = req('/es/dashboard/audit', { user: { id: 'u1', role: 'SUPER_ADMIN' } });
    res = await runProxy(r);
    expect(res).toEqual(mockIntlMiddlewareResult);
  });
});

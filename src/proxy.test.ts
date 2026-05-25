import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mock internal auth module first before importing proxy
vi.mock('./auth', () => {
  return {
    auth: (middlewareFn: unknown) => {
      // Direct pass-through so we can test the raw middleware function
      return middlewareFn;
    },
  };
});

// 2. Mock `./i18n/routing` to avoid next/navigation dynamic ESM resolution errors in vitest
vi.mock('./i18n/routing', () => {
  return {
    routing: {
      locales: ['es', 'en'],
      defaultLocale: 'es',
      localePrefix: 'always',
    },
  };
});

// 3. Mock next-intl/middleware
vi.mock('next-intl/middleware', () => {
  return {
    default: vi.fn(() => vi.fn(() => ({ status: 200, intl: true }))),
  };
});

// 4. Mock next/server
vi.mock('next/server', () => {
  return {
    NextResponse: {
      redirect: vi.fn((url) => ({
        status: 307,
        headers: { Location: url.toString() },
        redirectUrl: url.toString(),
      })),
      next: vi.fn(() => ({ status: 200, next: true })),
    },
  };
});

// Import proxy, createMiddleware and NextResponse after establishing mocks
import proxy from './proxy';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

const mockIntlMiddlewareResult = { status: 200, intl: true };
// Retrieve the actual mock function instantiated inside proxy.ts
const mockIntlMiddleware = vi.mocked(createMiddleware).mock.results[0].value;

const runProxy = async (req: unknown) => {
  return (proxy as unknown as any)(req);
};

describe('proxy.ts Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeReq = (pathname: string, authData: unknown = null, queryParams = '') => {
    const baseUrl = 'http://localhost:3400';
    const urlStr = `${baseUrl}${pathname}${queryParams}`;
    return {
      url: urlStr,
      nextUrl: {
        pathname,
      },
      auth: authData,
    } as unknown as any;
  };

  describe('Locale & Landing Page Rules', () => {
    it('should pass root "/" to intlMiddleware', async () => {
      const req = makeReq('/');
      const res = await runProxy(req);

      expect(mockIntlMiddleware).toHaveBeenCalledWith(req);
      expect(res).toEqual(mockIntlMiddlewareResult);
    });

    it('should pass locale roots like "/es" or "/en" to intlMiddleware', async () => {
      const reqEs = makeReq('/es');
      const resEs = await runProxy(reqEs);
      expect(mockIntlMiddleware).toHaveBeenCalledWith(reqEs);
      expect(resEs).toEqual(mockIntlMiddlewareResult);

      const reqEn = makeReq('/en');
      const resEn = await runProxy(reqEn);
      expect(mockIntlMiddleware).toHaveBeenCalledWith(reqEn);
      expect(resEn).toEqual(mockIntlMiddlewareResult);
    });
  });

  describe('MFA Setup and Enrollment Rules', () => {
    it('should redirect to "/login/mfa" when user is logged in, MFA is enabled, but not verified', async () => {
      const req = makeReq('/es/dashboard', {
        user: {
          id: 'user-1',
          role: 'USER',
          mfaEnabled: true,
          mfa_verified: false,
        },
      });

      const res = await runProxy(req);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3400/es/login/mfa',
        })
      );
      expect(res.redirectUrl).toBe('http://localhost:3400/es/login/mfa');
    });

    it('should redirect to "/login/mfa/setup" when user is logged in, MFA is enforced, but not enabled', async () => {
      const req = makeReq('/en/dashboard', {
        user: {
          id: 'user-1',
          role: 'USER',
          mfaEnforced: true,
          mfaEnabled: false,
        },
      });

      const res = await runProxy(req);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3400/en/login/mfa/setup',
        })
      );
      expect(res.redirectUrl).toBe('http://localhost:3400/en/login/mfa/setup');
    });

    it('should not redirect if already on MFA setup/verification pages to prevent loops', async () => {
      const req = makeReq('/es/login/mfa', {
        user: {
          id: 'user-1',
          role: 'USER',
          mfaEnabled: true,
          mfa_verified: false,
        },
      });

      const res = await runProxy(req);

      // Falls through to public route logic or intlMiddleware
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });

  describe('Public Routes Routing (Login/Register)', () => {
    it('should render login page for unauthenticated users', async () => {
      const req = makeReq('/es/login');
      const res = await runProxy(req);

      expect(mockIntlMiddleware).toHaveBeenCalledWith(req);
      expect(res).toEqual(mockIntlMiddlewareResult);
    });

    it('should redirect to callbackUrl when authenticated user hits login', async () => {
      const req = makeReq(
        '/es/login',
        { user: { id: 'u1' } },
        '?callbackUrl=http://localhost:3300/exams'
      );
      const res = await runProxy(req);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3300/exams',
        })
      );
      expect(res.redirectUrl).toBe('http://localhost:3300/exams');
    });

    it('should redirect to dashboard when authenticated user hits login without callbackUrl', async () => {
      const req = makeReq('/en/login', { user: { id: 'u1' } });
      const res = await runProxy(req);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3400/en/dashboard',
        })
      );
      expect(res.redirectUrl).toBe('http://localhost:3400/en/dashboard');
    });
  });

  describe('Dashboard Route Protection & RBAC', () => {
    it('should redirect to "/login" if unauthenticated user attempts to access dashboard', async () => {
      const req = makeReq('/es/dashboard');
      const res = await runProxy(req);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3400/es/login',
        })
      );
    });

    it('should allow normal dashboard access for authenticated users', async () => {
      const req = makeReq('/es/dashboard', { user: { id: 'u1', role: 'USER' } });
      const res = await runProxy(req);

      expect(mockIntlMiddleware).toHaveBeenCalledWith(req);
      expect(res).toEqual(mockIntlMiddlewareResult);
    });

    it('should deny "/dashboard/tenants" for ADMIN and USER roles', async () => {
      // Admin should be denied (only SUPER_ADMIN allowed)
      const reqAdmin = makeReq('/es/dashboard/tenants', { user: { id: 'u1', role: 'ADMIN' } });
      let res = await runProxy(reqAdmin);
      expect(res.redirectUrl).toBe('http://localhost:3400/es/dashboard');

      // User should be denied
      const reqUser = makeReq('/es/dashboard/tenants', { user: { id: 'u1', role: 'USER' } });
      res = await runProxy(reqUser);
      expect(res.redirectUrl).toBe('http://localhost:3400/es/dashboard');
    });

    it('should allow "/dashboard/tenants" for SUPER_ADMIN role', async () => {
      const req = makeReq('/es/dashboard/tenants', { user: { id: 'u1', role: 'SUPER_ADMIN' } });
      const res = await runProxy(req);

      expect(mockIntlMiddleware).toHaveBeenCalledWith(req);
      expect(res).toEqual(mockIntlMiddlewareResult);
    });

    it('should deny "/dashboard/users" and "/dashboard/audit" for USER role', async () => {
      const reqUsers = makeReq('/es/dashboard/users', { user: { id: 'u1', role: 'USER' } });
      let res = await runProxy(reqUsers);
      expect(res.redirectUrl).toBe('http://localhost:3400/es/dashboard');

      const reqAudit = makeReq('/es/dashboard/audit', { user: { id: 'u1', role: 'USER' } });
      res = await runProxy(reqAudit);
      expect(res.redirectUrl).toBe('http://localhost:3400/es/dashboard');
    });

    it('should allow "/dashboard/users" and "/dashboard/audit" for ADMIN and SUPER_ADMIN roles', async () => {
      const reqAdmin = makeReq('/es/dashboard/users', { user: { id: 'u1', role: 'ADMIN' } });
      let res = await runProxy(reqAdmin);
      expect(res).toEqual(mockIntlMiddlewareResult);

      const reqSuper = makeReq('/es/dashboard/audit', { user: { id: 'u1', role: 'SUPER_ADMIN' } });
      res = await runProxy(reqSuper);
      expect(res).toEqual(mockIntlMiddlewareResult);
    });
  });
});

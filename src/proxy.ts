/**
 * 🛡️ ABDAuth Proxy Guard (Next.js 16 Industrial)
 * Orchestrates authentication, RBAC, and internationalization.
 * Uses `auth.api.getSession()` from `@/lib/auth` (better-auth).
 * Toda la lógica de negocio (MFA, RBAC, redirects) permanece idéntica.
 */

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { IndustrialUser } from '@/types/auth';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const queryTenantId = request.nextUrl.searchParams.get("tenantId");
  if (queryTenantId !== null) {
    request.cookies.set("active_tenant_id", queryTenantId);
  }

  const response = await handleProxy(request);

  if (queryTenantId !== null && response) {
    response.cookies.set("active_tenant_id", queryTenantId, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });
  }
  return response;
}

async function handleProxy(request: NextRequest) {
  // 🌐 Robust Locale Extraction (Ultra-Defensive for Next.js 16)
  const pathname = request.nextUrl?.pathname || '/';
  const segments = pathname.split('/');
  const rawLocale = segments.length > 1 ? segments[1] : '';
  const locale = (routing.locales as readonly string[]).includes(rawLocale) ? rawLocale : routing.defaultLocale;

  // 🆕 Get session from better-auth (Node.js runtime required for DB calls)
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isLoggedIn = !!session;
  const user = session?.user as IndustrialUser | undefined;
  const userRole = user?.role;

  // 🛡️ MFA Enforcement & Enrollment (Industrial Fail-Closed)
  const isMfaRoute = pathname.includes('/login/mfa');
  const isMfaSetupRoute = pathname.includes('/login/mfa/setup');

  if (isLoggedIn && !isMfaRoute && !isMfaSetupRoute) {
    // 1. Mandatory Verification (if enabled)
    if (user?.mfaEnabled && !user?.mfa_verified) {
      return NextResponse.redirect(new URL(`/${locale}/login/mfa`, request.url));
    }
    
    // 2. Mandatory Enrollment (if enforced but not yet enabled)
    if (user?.mfaEnforced && !user?.mfaEnabled) {
      const graceActive = !!user?.mfaGracePeriodActive;
      const loginsRemaining = user?.mfaGraceLoginsRemaining ?? 0;
      const isBypassed = !!user?.mfaGraceBypassed;

      if (graceActive && loginsRemaining > 0 && isBypassed) {
        // Allowed to bypass setup for this session
      } else {
        return NextResponse.redirect(new URL(`/${locale}/login/mfa/setup`, request.url));
      }
    }
  }

  // 🚪 Public Routes Protection
  const isPublicRoute = (pathname.includes('/login') || pathname.includes('/register')) && !isMfaRoute;
  
  if (isPublicRoute) {
    if (isLoggedIn) {
      const { searchParams } = new URL(request.url);
      const callbackUrl = searchParams.get('callbackUrl');
      
      if (callbackUrl) {
        return NextResponse.redirect(new URL(callbackUrl, request.url));
      }
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
    return intlMiddleware(request);
  }

  // 1. Root Redirect Logic (Absolute Root or Locale Roots)
  const isExactRoot = pathname === '/';
  const isLocaleRoot = routing.locales.some(loc => pathname === `/${loc}`);
  
  if (isExactRoot || isLocaleRoot) {
    // Allow the Landing Page to be rendered
    return intlMiddleware(request);
  }

  // 2. Dashboard Protection & RBAC
  if (pathname.includes('/dashboard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // 🔐 Role-Based Access Control
    const isSuperAdminRoute = pathname.includes('/dashboard/tenants');
    if (isSuperAdminRoute && userRole !== 'SUPER_ADMIN') {
      // Unauthorized access to TENANTS
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    const privilegedRoutes = ['/dashboard/users', '/dashboard/audit'];
    const isPrivilegedRoute = privilegedRoutes.some(route => pathname.includes(route));
    if (isPrivilegedRoute && !['SUPER_ADMIN', 'ADMIN', 'PROFESSOR'].includes(userRole || '')) {
      // Unauthorized access to privileged routes
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!.*api|_next/static|_next/image|.*\\.svg$).*)'],
};

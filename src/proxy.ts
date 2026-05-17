import { auth } from './auth';
import { NextResponse } from 'next/server';
import type { IndustrialUser } from '@/types/auth';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * 🛡️ ABDAuth Proxy Guard (Next.js 16 Industrial)
 * Orchestrates authentication, RBAC, and internationalization.
 */
export default auth((req) => {
  // 🌐 Robust Locale Extraction (Ultra-Defensive for Next.js 16)
  const pathname = req?.nextUrl?.pathname || "/";
  const segments = pathname.split('/');
  const rawLocale = segments.length > 1 ? segments[1] : '';
  const locale = (routing.locales as readonly string[]).includes(rawLocale) ? rawLocale : routing.defaultLocale;

  const isLoggedIn = !!req?.auth;
  const user = req?.auth?.user as IndustrialUser | undefined;
  const userRole = user?.role;

  // 🛡️ MFA Enforcement & Enrollment (Industrial Fail-Closed)
  const isMfaRoute = pathname.includes('/login/mfa');
  const isMfaSetupRoute = pathname.includes('/login/mfa/setup');

  if (isLoggedIn && !isMfaRoute && !isMfaSetupRoute) {
    // 1. Mandatory Verification (if enabled)
    if (user?.mfaEnabled && !user?.mfa_verified) {
      return NextResponse.redirect(new URL(`/${locale}/login/mfa`, req.url));
    }
    
    // 2. Mandatory Enrollment (if enforced but not yet enabled)
    if (user?.mfaEnforced && !user?.mfaEnabled) {
      return NextResponse.redirect(new URL(`/${locale}/login/mfa/setup`, req.url));
    }
  }

  // 🚪 Public Routes Protection
  const isPublicRoute = (pathname.includes('/login') || pathname.includes('/register')) && !isMfaRoute;
  
  if (isPublicRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }
    return intlMiddleware(req);
  }

  // 1. Root Redirect Logic (Absolute Root or Locale Roots)
  const isExactRoot = pathname === '/';
  const isLocaleRoot = routing.locales.some(loc => pathname === `/${loc}`);
  
  if (isExactRoot || isLocaleRoot) {
    // Allow the Landing Page to be rendered
    return intlMiddleware(req);
  }

  // 2. Dashboard Protection & RBAC
  if (pathname.includes('/dashboard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }

    // 🔐 Role-Based Access Control
    const isSuperAdminRoute = pathname.includes('/dashboard/tenants');
    if (isSuperAdminRoute && userRole !== 'SUPER_ADMIN') {
      // Unauthorized access to TENANTS
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }

    const privilegedRoutes = ['/dashboard/users', '/dashboard/audit'];
    const isPrivilegedRoute = privilegedRoutes.some(route => pathname.includes(route));
    if (isPrivilegedRoute && !['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      // Unauthorized access to privileged routes
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ['/((?!.*api|_next/static|_next/image|.*\\.svg$).*)'],
};

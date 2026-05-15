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
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user as unknown as IndustrialUser | undefined;
  const userRole = user?.role;

  // 🌐 Robust Locale Extraction
  const segments = pathname.split('/');
  const rawLocale = segments.length > 1 ? segments[1] : '';
  const isAuthorizedLocale = routing.locales.includes(rawLocale as typeof routing.locales[number]);
  const locale = isAuthorizedLocale ? rawLocale : routing.defaultLocale;


  // 🚪 Public Routes Protection
  const isPublicRoute = pathname.includes('/login') || pathname.includes('/register');
  
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
  matcher: ['/((?!api|_next/static|_next/image|.*\\.svg$).*)'],
};

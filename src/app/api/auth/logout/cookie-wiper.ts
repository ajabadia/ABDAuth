import type { NextResponse } from 'next/server';

/**
 * 🧹 Wipes better-auth session cookies from a response.
 */
export const COOKIES_TO_WIPE = [
  'better-auth.session_token',
  'better-auth.session_data',
  'better-auth.dont_remember',
  'two_factor',
];

export function wipeCookies(response: NextResponse): void {
  for (const cookieName of COOKIES_TO_WIPE) {
    const isSecureCookie = cookieName.startsWith('__Secure-');
    response.cookies.set(cookieName, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: 'lax',
    });
  }
}

export function setNoCacheHeaders(response: NextResponse): void {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
}

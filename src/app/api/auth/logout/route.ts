import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚿 Central SSO Logout Handler (ABDAuth)
 * Wipes the central NextAuth session cookies and redirects back to the satellite application.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri') || searchParams.get('callbackUrl') || 'https://abd-auth.vercel.app';

  const response = NextResponse.redirect(new URL(redirectUri));

  // 🧹 Wipe NextAuth/Auth.js session cookies (both standard and secure production ones)
  const cookiesToWipe = [
    // Auth.js v5 (NextAuth v5) cookies
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'authjs.callback-url',
    '__Secure-authjs.callback-url',
    'authjs.csrf-token',
    '__Secure-authjs.csrf-token',
    // NextAuth v4 legacy cookies
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.csrf-token'
  ];

  for (const cookieName of cookiesToWipe) {
    // Determine secure and samesite based on cookie prefix
    const isSecureCookie = cookieName.startsWith('__Secure-');
    
    response.cookies.set(cookieName, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: 'lax'
    });
  }

  // 🛡️ Volumetric Anti-Caching Headers (SOC2 Standards)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚿 Central SSO Logout Handler (ABDAuth)
 * Wipes the central NextAuth session cookies and redirects back to the satellite application.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri') || searchParams.get('callbackUrl') || 'https://abd-auth.vercel.app';

  const response = NextResponse.redirect(new URL(redirectUri));

  // 🧹 Wipe NextAuth session cookies (both standard and secure production ones)
  const cookiesToWipe = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token'
  ];

  for (const cookieName of cookiesToWipe) {
    response.cookies.set(cookieName, '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
  }

  return response;
}

/**
 * @purpose Gestiona el proceso de logout para ABDAuth eliminando cookies de sesión y realizando SLO Front-Channel con aplicaciones satélite registradas.
 * @purpose_en Handles the logout process for ABDAuth by wiping session cookies and performing Front-Channel SLO with registered satellite applications.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:9rictc
 * @lastUpdated 2026-06-23T22:38:51.270Z
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { wipeCookies, setNoCacheHeaders, COOKIES_TO_WIPE } from './cookie-wiper';
import { generateSloPage } from './slo-html';

/**
 * 🚿 Central SSO Logout Handler (ABDAuth)
 * Wipes the better-auth session cookies and performs Front-Channel SLO
 * by dynamically loading the registered satellite applications from MongoDB
 * and rendering an HTML page with invisible iframes that trigger silent logout
 * on each satellite.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri') || searchParams.get('callbackUrl') || 'http://localhost:5001';

  // 🛰️ Determine the execution environment from the requester's origin
  const isLocalEnvironment = process.env.NODE_ENV !== 'production';

  // 🛰️ Dynamically resolve registered satellite applications from MongoDB
  let logoutUrls: string[] = [];
  try {
    const apps = await applicationRepository.list({ active: true } as Record<string, unknown>);
    logoutUrls = apps.flatMap(app => {
      const matchingUris = (app.redirectUris || []).filter((uri: string) => {
        const uriIsLocal = uri.includes('localhost') || uri.includes('127.0.0.1');
        return isLocalEnvironment ? uriIsLocal : !uriIsLocal;
      });

      return matchingUris
        .slice(0, 1)
        .map((uri: string) =>
          uri.replace('/api/auth/federated/callback', '/api/auth/logout')
        );
    });
  } catch (err) {
    console.error('[ABDAuth_SLO_RESOLVE_ERROR] Failed to load satellite apps:', err);
  }

  // If there are registered satellites, perform Front-Channel SLO via dynamic HTML response
  if (logoutUrls.length > 0) {
    const htmlResponseContent = generateSloPage(logoutUrls, redirectUri);

    const response = new NextResponse(htmlResponseContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

    wipeCookies(response);

    return response;
  }

  // Otherwise, fallback to a standard clean redirect
  const response = NextResponse.redirect(new URL(redirectUri));
  wipeCookies(response);
  setNoCacheHeaders(response);

  return response;
}

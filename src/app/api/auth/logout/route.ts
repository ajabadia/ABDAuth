import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';

/**
 * 🚿 Central SSO Logout Handler (ABDAuth)
 * Wipes the central NextAuth session cookies and performs Front-Channel SLO
 * by dynamically loading the registered satellite applications from MongoDB
 * and rendering an HTML page with invisible iframes that trigger silent logout
 * on each satellite.
 *
 * The logout URLs are automatically resolved based on the requester's environment:
 * - localhost / 127.0.0.1 → maps redirectUris that contain 'localhost'
 * - Production → maps redirectUris that do NOT contain 'localhost'
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri') || searchParams.get('callbackUrl') || 'http://localhost:3400';

  // 🛰️ Determine the execution environment from the requester's origin
  const isLocalEnvironment = redirectUri.includes('localhost') || redirectUri.includes('127.0.0.1');

  // 🛰️ Dynamically resolve registered satellite applications from MongoDB
  let logoutUrls: string[] = [];
  try {
    const apps = await applicationRepository.list({ active: true } as any);
    logoutUrls = apps.flatMap(app => {
      // Filter redirectUris matching the current environment (local vs production)
      const matchingUris = (app.redirectUris || []).filter((uri: string) => {
        const uriIsLocal = uri.includes('localhost') || uri.includes('127.0.0.1');
        return isLocalEnvironment ? uriIsLocal : !uriIsLocal;
      });

      // Replace callback path with logout path in the first matching URI per app
      return matchingUris
        .slice(0, 1)
        .map((uri: string) =>
          uri.replace('/api/auth/federated/callback', '/api/auth/logout')
        );
    });
  } catch (err) {
    console.error('[ABDAuth_SLO_RESOLVE_ERROR] Failed to load satellite apps:', err);
  }

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

  // If there are registered satellites, perform Front-Channel SLO via dynamic HTML response
  if (logoutUrls.length > 0) {
    const iframeList = logoutUrls
      .map(url => `  <iframe src="${url}?silent=true" style="display:none;" onload="iframeLoaded()"></iframe>`)
      .join('\n');

    const htmlResponseContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="cache-control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="pragma" content="no-cache" />
  <meta http-equiv="expires" content="0" />
  <title>Cerrando sesión...</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: linear-gradient(135deg, #080d1a 0%, #0b1320 50%, #060b14 100%);
      color: #4b7db5;
      font-family: 'Courier New', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 40px;
      background: rgba(11, 19, 32, 0.8);
      border: 1px solid rgba(59, 130, 246, 0.15);
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }
    .logo {
      font-size: 10px;
      color: rgba(59, 130, 246, 0.4);
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .spinner-ring {
      position: relative;
      width: 40px;
      height: 40px;
    }
    .spinner-ring::before,
    .spinner-ring::after {
      content: '';
      position: absolute;
      border-radius: 50%;
    }
    .spinner-ring::before {
      inset: 0;
      border: 2px solid rgba(59, 130, 246, 0.1);
    }
    .spinner-ring::after {
      inset: 0;
      border: 2px solid transparent;
      border-top-color: #3b82f6;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .status {
      font-size: 11px;
      color: rgba(75, 125, 181, 0.7);
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .progress {
      width: 200px;
      height: 2px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 1px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      animation: progress 1.5s ease-in-out forwards;
    }
    @keyframes progress {
      from { width: 0%; }
      to { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">ABD Suite &bull; Sistema Industrial</div>
    <div class="spinner-ring"></div>
    <p class="status">Cerrando sesión en el ecosistema&hellip;</p>
    <div class="progress"><div class="progress-bar"></div></div>
  </div>

${iframeList}

  <script>
    var loaded = 0;
    var total = ${logoutUrls.length};
    function iframeLoaded() {
      loaded++;
      if (loaded >= total) {
        window.location.href = ${JSON.stringify(redirectUri)};
      }
    }
    // ⏱️ Fallback redirect — never block the user for more than 2s
    setTimeout(function() {
      window.location.href = ${JSON.stringify(redirectUri)};
    }, 2000);
  </script>
</body>
</html>`;

    const response = new NextResponse(htmlResponseContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

    for (const cookieName of cookiesToWipe) {
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

    return response;
  }

  // Otherwise, fallback to a standard clean redirect
  const response = NextResponse.redirect(new URL(redirectUri));

  for (const cookieName of cookiesToWipe) {
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

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

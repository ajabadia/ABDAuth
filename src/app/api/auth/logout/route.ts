import { NextRequest, NextResponse } from 'next/server';

/**
 * 🚿 Central SSO Logout Handler (ABDAuth)
 * Wipes the central NextAuth session cookies and redirects back to the satellite application.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect_uri') || searchParams.get('callbackUrl') || 'https://abd-auth.vercel.app';

  // 🧹 Prepare the list of satellite logouts from environment variables
  const satellitesConfig = process.env.SATELITE_LOGOUT_URLS || '';
  const logoutUrls = satellitesConfig
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0);

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
    const htmlResponseContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="cache-control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="pragma" content="no-cache" />
  <meta http-equiv="expires" content="0" />
  <title>Cerrando sesión...</title>
  <style>
    body {
      background-color: #0b0f19;
      color: #9ca3af;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .spinner {
      border: 3px solid rgba(156, 163, 175, 0.1);
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p>Cerrando sesión en el ecosistema federado...</p>
  
  ${logoutUrls.map(url => `<iframe src="${url}?silent=true" style="display:none;" onload="iframeLoaded()"></iframe>`).join('\n  ')}
  
  <script>
    var loaded = 0;
    var total = ${logoutUrls.length};
    function iframeLoaded() {
      loaded++;
      if (loaded >= total) {
        window.location.href = ${JSON.stringify(redirectUri)};
      }
    }
    // Fallback redirect in case of network block (1.5 seconds)
    setTimeout(function() {
      window.location.href = ${JSON.stringify(redirectUri)};
    }, 1500);
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


/**
 * @purpose Renderiza una página de logout frontal con un canal único (SLO) que incluye iframes para cada satélite, gestionando el proceso de logout y redirigiendo a una URI especificada al final.
 * @purpose_en Renders a Front-Channel Single Logout (SLO) HTML page with iframes for each satellite, handling the logout process and redirecting to a specified URI upon completion.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:0,sig:12vuezp
 * @lastUpdated 2026-06-23T22:38:58.527Z
 */

/**
 * Generates the Front-Channel SLO HTML page with iframes for each satellite.
 */
export function generateSloPage(logoutUrls: string[], redirectUri: string): string {
  const iframeList = logoutUrls
    .map(url => `  <iframe src="${url}?silent=true" style="display:none;" onload="iframeLoaded()"></iframe>`)
    .join('\n');

  return `<!DOCTYPE html>
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
    setTimeout(function() {
      window.location.href = ${JSON.stringify(redirectUri)};
    }, 2000);
  </script>
</body>
</html>`;
}

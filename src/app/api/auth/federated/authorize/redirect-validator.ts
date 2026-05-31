/**
 * Validates a redirect URI against an array of registered URIs.
 * Supports exact matching and dynamic subdomain matching.
 */
export function isRedirectUriValid(redirectUri: string, registeredUris: string[]): boolean {
  if (registeredUris.includes(redirectUri)) return true;

  try {
    const reqUrl = new URL(redirectUri);
    for (const reg of registeredUris) {
      try {
        const regUrl = new URL(reg);
        if (
          reqUrl.protocol !== regUrl.protocol ||
          reqUrl.pathname !== regUrl.pathname ||
          reqUrl.port !== regUrl.port
        ) {
          continue;
        }
        const reqHost = reqUrl.hostname;
        const regHost = regUrl.hostname;
        if (reqHost.endsWith(regHost)) {
          const prefix = reqHost.substring(0, reqHost.length - regHost.length);
          if (prefix === '' || prefix.endsWith('.')) {
            return true;
          }
        }
      } catch {
        // Ignore invalid registered URL parsing errors
      }
    }
  } catch {
    // Ignore invalid incoming redirectUri parsing errors
  }

  return false;
}

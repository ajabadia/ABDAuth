import { NextResponse } from 'next/server';

/**
 * 🛡️ Industrial API Security Guard
 * Checks for Payload Size limits and enforces CSRF protection for mutation endpoints.
 */
export function checkApiSecurity(req: Request, options = { maxSize: 1024 * 1024 }): NextResponse | null {
  // 1. Payload Size Limit Protection
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > options.maxSize) {
    return NextResponse.json({ error: 'PAYLOAD_TOO_LARGE' }, { status: 413 });
  }

  // 2. CSRF Protection for Mutations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Simple request CSRF mitigation: require application/json or custom headers.
    // Simple forms (the main CSRF vector) can only send application/x-www-form-urlencoded, multipart/form-data, or text/plain.
    // Forcing application/json triggers CORS preflight for cross-origin requests, blocking CSRF.
    const contentType = req.headers.get('content-type') || '';
    
    // Allow DELETE without content-type, but require it for POST/PATCH
    if (req.method !== 'DELETE' && !contentType.includes('application/json')) {
       return NextResponse.json({ error: 'CSRF_PROTECTION: Invalid Content-Type' }, { status: 415 });
    }
  }

  return null;
}

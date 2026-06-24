/**
 * @purpose Gestiona la creación de sesiones de usuario federadas en MongoDB y establece una cookie de sesión.
 * @purpose_en Manages the creation of federated user sessions in MongoDB and sets a session cookie.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:ziaun1
 * @lastUpdated 2026-06-23T22:45:01.924Z
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { mongoClientPromise } from '@/lib/mongodb';

const SESSION_COOKIE_NAME = 'better-auth.session_token';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 3600; // 7 days

/**
 * 🎫 Creates a better-auth-compatible session directly in MongoDB
 * and returns a NextResponse with the session cookie set.
 *
 * This bypasses better-auth's signIn API for federated users who
 * don't have a local password. The session is fully compatible
 * with better-auth's session validation.
 */
export async function setFederatedSession(params: {
  userId: string;
  redirectTo: string;
  req: Request;
}): Promise<NextResponse> {
  const { userId, redirectTo } = params;

  // Generate a cryptographically random session token
  const sessionToken = crypto.randomUUID();

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const now = new Date();

  const ipAddress = params.req.headers.get('x-forwarded-for') ?? undefined;
  const userAgent = params.req.headers.get('user-agent') ?? undefined;

  // Connect to MongoDB and create the session document
  const client = await mongoClientPromise;
  const dbName = process.env.MONGODB_AUTH_DB || 'ABDElevators-Auth';
  const collection = client.db(dbName).collection('sessions');

  await collection.insertOne({
    userId,
    token: sessionToken,
    expiresAt,
    createdAt: now,
    updatedAt: now,
    ...(ipAddress ? { ipAddress } : {}),
    ...(userAgent ? { userAgent } : {}),
  });

  const response = NextResponse.redirect(new URL(redirectTo, params.req.url));
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}

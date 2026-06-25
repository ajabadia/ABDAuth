/**
 * @purpose Gestiona autenticación y middleware internacionalizado para la aplicación ABDAuth.
 * @purpose_en Manages authentication and internationalization middleware for the ABDAuth application.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:0ebq3p
 * @lastUpdated 2026-06-23T16:26:35.282Z
 */

import { withIndustrialAuth } from '@ajabadia/satellite-sdk/auth-middleware';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const proxy = withIndustrialAuth({
  appId: process.env.NEXT_PUBLIC_APP_ID || 'auth',
  clientId: process.env.AUTH_CLIENT_ID as string,
  clientSecret: process.env.AUTH_CLIENT_SECRET || '',
  jwtSecret: process.env.AUTH_JWT_SECRET!,
  publicPaths: ['/', '/login', '/register', '/logout-success', '/activate'],
  intlMiddleware,
} as unknown as Parameters<typeof withIndustrialAuth>[0]);

export default proxy;

export const config = {
  // Intercept all routes except api, static resources, and images
  matcher: ['/((?!api|_next/static|_next/image|.*\\.svg$).*)'],
};

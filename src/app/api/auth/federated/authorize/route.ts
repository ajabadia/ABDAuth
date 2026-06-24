/**
 * @purpose Gestiona el flujo de autorización para solicitudes de autenticación federada, validando credenciales del cliente, URIs de redirección y permisos del usuario antes de emitir un código de autorización.
 * @purpose_en Handles the authorization flow for federated authentication requests, validating client credentials, redirect URIs, and user permissions before issuing an authorization code.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:11,sig:1ytmr7i
 * @lastUpdated 2026-06-21T10:12:16.494Z
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/get-session';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { federatedCodeRepository } from '@/lib/repositories/FederatedCodeRepository';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import type { UserTenantMembership } from '@/lib/schemas/user';
import type { TenantId } from '@/lib/schemas/common';
import type { IndustrialUser } from '@/types/auth';
import crypto from 'crypto';
import { isRedirectUriValid } from './redirect-validator';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state') || '';
  const tenantParam = searchParams.get('tenant') || '';
  const errorParam = searchParams.get('error');

  if (errorParam) {
    const errorMap: Record<string, string> = { 'app_not_allowed': 'APPLICATION_NOT_LICENSED', 'unauthorized_tenant_access': 'UNAUTHORIZED_TENANT_ACCESS' };
    const mappedError = errorMap[errorParam] || errorParam.toUpperCase();
    const dashboardUrl = new URL('/dashboard', req.url);
    dashboardUrl.searchParams.set('error', mappedError);
    if (clientId) { const app = await applicationRepository.findByClientId(clientId); if (app) dashboardUrl.searchParams.set('app', app.slug || app.name); }
    return NextResponse.redirect(dashboardUrl);
  }

  if (!clientId || !redirectUri) return NextResponse.json({ error: 'Missing client_id or redirect_uri' }, { status: 400 });

  const app = await applicationRepository.findByClientId(clientId);
  if (!app || !app.active) return NextResponse.json({ error: 'Invalid or inactive client' }, { status: 401 });
  if (!isRedirectUriValid(redirectUri, app.redirectUris)) return NextResponse.json({ error: 'Redirect URI mismatch' }, { status: 400 });

  const session = await getServerSession();
  if (!session?.user) {
    let locale = 'es';
    if (state.startsWith('/en') || state.startsWith('/en/')) {
      locale = 'en';
    }
    const loginUrl = new URL(`/${locale}/login`, req.url);
    const callback = new URL(req.url);
    if (tenantParam) { callback.searchParams.set('tenant', tenantParam); loginUrl.searchParams.set('tenant', tenantParam); }
    loginUrl.searchParams.set('callbackUrl', callback.toString());
    return NextResponse.redirect(loginUrl);
  }

  const user = await userRepository.findById(session.user.id || '');
  const effectiveTenantId = tenantParam || user?.tenantId || '';
  const appSlug = app.slug || app.name?.toLowerCase() || '';
  const dashboardUrl = new URL('/dashboard', req.url);

  if (user) {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    if (!isSuperAdmin) {
      if (user.active === false) { dashboardUrl.searchParams.set('error', 'UNAUTHORIZED_TENANT_ACCESS'); dashboardUrl.searchParams.set('app', appSlug); return NextResponse.redirect(dashboardUrl); }
      const membership: UserTenantMembership | undefined = user.tenants?.find((t: UserTenantMembership) => t.tenantId === effectiveTenantId);
      if (!membership || membership.status === 'suspended') { dashboardUrl.searchParams.set('error', 'UNAUTHORIZED_TENANT_ACCESS'); dashboardUrl.searchParams.set('app', appSlug); return NextResponse.redirect(dashboardUrl); }
      const tenant = await tenantRepository.findByTenantId(effectiveTenantId as TenantId);
      const tenantAllowedApps = tenant?.allowedApps || [];
      const isPrivilegedRole = membership.role === 'admin' || membership.role === 'owner';
      if (appSlug && appSlug !== 'landing' && !tenantAllowedApps.includes(appSlug)) { dashboardUrl.searchParams.set('error', 'APPLICATION_NOT_LICENSED'); dashboardUrl.searchParams.set('app', appSlug); return NextResponse.redirect(dashboardUrl); }
      if (!isPrivilegedRole && appSlug && appSlug !== 'landing') {
        const userAllowedApps = membership.allowedApps || [];
        if (!userAllowedApps.includes(appSlug)) { dashboardUrl.searchParams.set('error', 'APPLICATION_NOT_LICENSED'); dashboardUrl.searchParams.set('app', appSlug); return NextResponse.redirect(dashboardUrl); }
      }
    }
  }

  const code = crypto.randomBytes(24).toString('hex');
  const centralUser = session.user as unknown as IndustrialUser;
  await federatedCodeRepository.create({ code, clientId, userId: session.user.id || '', redirectUri, expiresAt: new Date(Date.now() + 5 * 60 * 1000), used: false, sessionId: centralUser.sessionId || undefined });

  const target = new URL(redirectUri);
  target.searchParams.set('code', code);
  if (state) target.searchParams.set('state', state);
  return NextResponse.redirect(target);
}

import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { NextResponse } from 'next/server';
import type { TenantId } from '@/lib/schemas/common';

/**
 * 📡 Public Tenant Metadata Endpoint
 * GET /api/auth/tenant/info?subdomain=... or ?tenantId=...
 * 
 * Fetches tenant branding and status to allow satellites to dress the interface
 * and propagate pre-vested login configurations before authentication.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get('subdomain') || searchParams.get('tenantId');

  if (!identifier) {
    return NextResponse.json({ error: 'Missing subdomain or tenantId parameter' }, { status: 400 });
  }

  try {
    // 1. Direct fetch by tenantId
    let tenant = await tenantRepository.findByTenantId(identifier as TenantId);

    // 2. Robust fallback lookup by dbPrefix, full name or sub-string within all tenants
    if (!tenant) {
      const allTenants = await tenantRepository.list({});
      tenant = allTenants.find(t => 
        t.active && 
        (t.tenantId.toLowerCase() === identifier.toLowerCase() ||
         t.tenantId.toLowerCase().includes(identifier.toLowerCase()) ||
         t.dbPrefix.toLowerCase() === identifier.toLowerCase() ||
         t.name.toLowerCase().includes(identifier.toLowerCase()))
      ) || null;
    }

    if (!tenant || !tenant.active) {
      return NextResponse.json({ active: false, error: 'Tenant not found or inactive' }, { status: 404 });
    }

    return NextResponse.json({
      active: true,
      tenantId: tenant.tenantId,
      name: tenant.name,
      dbPrefix: tenant.dbPrefix,
      isolationStrategy: tenant.isolationStrategy,
      branding: tenant.branding || null,
    });
  } catch (error) {
    console.error('[TENANT_INFO_API_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

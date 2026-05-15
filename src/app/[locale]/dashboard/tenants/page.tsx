import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/TenantRepository";
import { getTranslations } from 'next-intl/server';
import type { IndustrialSession } from "@/types/auth";
import { TenantManagementContainer } from "@/components/admin/tenants/TenantManagementContainer";

/**
 * 🏢 Industrial Tenant Management Panel
 */
export default async function TenantsPage() {
  const session = await auth();
  const t = await getTranslations('dashboard.tenants');

  if (!session) {
    redirect("/login");
  }

  const user = session.user as unknown as IndustrialSession;

  // 🔌 Fetching initial data for the client container
  const tenants = await tenantRepository.listForCurrentSession(user);

  // Serialize all translations for the client component (Canonical object)
  const translations = {
    title: t('title'),
    subtitle: t('subtitle'),
    new_tenant: t('new_tenant'),
    edit_tenant: t('edit_tenant'),
    register_tenant: t('register_tenant'),
    industry: t('industry'),
    database: t('database'),
    confirm_delete: t('confirm_delete'),
    edit_action: t('actions.edit'),
    delete_action: t('actions.delete'),
    orchestrator_version: t('orchestrator_version'),
    name_label: t('name_label'),
    id_label: t('id_label'),
    isolation_label: t('isolation_label'),
    status_label: t('status_label'),
    industries: {
      industrial: t('industries.industrial'),
      energy: t('industries.energy'),
      logistics: t('industries.logistics'),
      security: t('industries.security'),
    },
    actions: {
      edit: t('actions.edit'),
      delete: t('actions.delete'),
      save: t('actions.save'),
      cancel: t('actions.cancel'),
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <TenantManagementContainer 
        initialTenants={JSON.parse(JSON.stringify(tenants))} 
        translations={translations}
      />
    </div>
  );
}

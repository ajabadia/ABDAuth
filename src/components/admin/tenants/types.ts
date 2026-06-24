/**
 * @purpose Gestiona tipos y interfaces para acciones de gestión de inquilinos y traducciones.
 * @purpose_en Defines types and interfaces for tenant management actions and translations.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:3,imports:1,sig:2nnz8q
 * @lastUpdated 2026-06-21T10:33:50.450Z
 */

import type { Tenant } from "@/lib/schemas/auth"

export type SaveTenantAction = (data: Partial<Tenant>) => Promise<void>
export type SubmitTenantAction = (data: Partial<Tenant>) => void

export interface TenantManagementTranslations {
  title: string
  subtitle: string
  new_tenant: string
  edit_tenant: string
  register_tenant: string
  industry: string
  database: string
  confirm_delete: string
  edit_action: string
  delete_action: string
  orchestrator_version: string
  name_label: string
  id_label: string
  isolation_label: string
  status_label: string
  industries: {
    industrial: string
    energy: string
    logistics: string
    security: string
  }
  actions: {
    edit: string
    delete: string
    save: string
    cancel: string
  }
}

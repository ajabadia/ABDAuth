'use client';

/**
 * @purpose Gestiona un componente selector de inquilino que se conecta al TenantSelectorConnector y maneja acciones de cambio de inquilino.
 * @purpose_en Renders a tenant selector component that connects to the TenantSelectorConnector and handles tenant switching actions.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:mxwq9c
 * @lastUpdated 2026-06-21T12:05:43.634Z
 */

import { TenantSelectorConnector } from "@ajabadia/ecosystem-widgets";
import { switchTenantAction } from "@/app/[locale]/dashboard/actions";

interface SessionUser {
  id?: string;
  email?: string;
  role?: string;
  tenantId?: string;
}

interface TenantSelectorProps {
  sessionUser?: SessionUser;
  variant?: 'dropdown' | 'trigger' | 'content';
  isOpen?: boolean;
}

export function TenantSelector({ sessionUser, variant, isOpen }: TenantSelectorProps) {
  return <TenantSelectorConnector sessionUser={sessionUser} variant={variant} isOpen={isOpen} enableContexts onTenantSwitch={switchTenantAction} />;
}

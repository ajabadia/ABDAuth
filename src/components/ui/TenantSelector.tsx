'use client';

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

/**
 * @purpose Renderiza la página de configuración de seguridad para un usuario, incluyendo control de MFA, gestión de contraseñas y gobernanza de sesiones.
 * @purpose_en Renders the security settings page for a user, including MFA control, password management, and session governance.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:11,sig:1ffeajl
 * @lastUpdated 2026-06-21T10:22:21.268Z
 */

import { getTranslations } from 'next-intl/server';
import { MfaControl } from '@/components/dashboard/security/MfaControl';
import { PasswordManager } from '@/components/dashboard/security/PasswordManager';
import { SessionManager } from '@/components/dashboard/security/SessionManager';
import { getServerSession } from '@/lib/get-session';
import { Key } from 'lucide-react';
import { SessionService } from '@/services/auth/SessionService';
import { userRepository } from '@/lib/repositories/UserRepository';
import { PageHeader } from "@/components/ui/industrial/PageHeader";
import type { IndustrialUser } from '@/types/auth';
import type { EntityId } from '@/lib/schemas/common';

export default async function SecurityPage() {
  const t = await getTranslations('dashboard.security');
  const d = await getTranslations('dashboard');
  const session = await getServerSession();
  const user = session?.user as IndustrialUser;

  if (!user) return null;
  
  // 🛰️ Fetch Latest Identity State from DB
  const dbUser = await userRepository.findById(user.id as EntityId);
  const mfaEnforced = dbUser?.mfaEnforced ?? user.mfaEnforced;

  // 🛰️ Data Fetching (Industrial/Server-side)
  const isMfaActive = dbUser?.mfaEnabled ?? false;
  const activeSessions = await SessionService.getUserSessions(user.id as EntityId, user.tenantId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PageHeader 
        title={t('title')}
        subtitle={t('description')}
        breadcrumb={`${d('control_console')} • ${d('menu.security')}`}
        icon={Key}
        backHref="/dashboard"
        backAriaLabel={d('back_to_dashboard')}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 🔐 Multi-Factor Authentication Control */}
        <MfaControl isActive={isMfaActive} isMandatory={!!mfaEnforced} />

        {/* 🔑 Password Governance */}
        <PasswordManager />
        
        {/* 🗝️ Session Governance */}
        <div className="lg:col-span-2">
          <SessionManager sessions={activeSessions.map(s => ({ ...s, _id: s._id?.toString(), isCurrent: s._id?.toString() === user.sessionId }))} />
        </div>
      </div>
    </div>
  );
}

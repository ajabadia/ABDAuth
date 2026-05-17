import { getTranslations } from 'next-intl/server';
import { MfaControl } from '@/components/dashboard/security/MfaControl';
import { PasswordManager } from '@/components/dashboard/security/PasswordManager';
import { SessionManager } from '@/components/dashboard/security/SessionManager';
import { auth } from '@/auth';
import { MfaService } from '@/services/auth/MfaService';
import { SessionService } from '@/services/auth/SessionService';
import { userRepository } from '@/lib/repositories/UserRepository';
import type { IndustrialUser } from '@/types/auth';
import type { EntityId } from '@/lib/schemas/common';

export default async function SecurityPage() {
  const t = await getTranslations('dashboard.security');
  const session = await auth();
  const user = session?.user as IndustrialUser;

  if (!user) return null;
  
  // 🛰️ Fetch Latest Identity State from DB
  const dbUser = await userRepository.findById(user.id as EntityId);
  const mfaEnforced = dbUser?.mfaEnforced ?? user.mfaEnforced;

  // 🛰️ Data Fetching (Industrial/Server-side)
  const isMfaActive = await MfaService.isRequired(user.id);
  const activeSessions = await SessionService.getUserSessions(user.id as EntityId, user.tenantId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 🔐 Multi-Factor Authentication Control */}
        <MfaControl isActive={isMfaActive} isMandatory={!!mfaEnforced} />

        {/* 🔑 Password Governance */}
        <PasswordManager />
        
        {/* 🗝️ Session Governance */}
        <div className="lg:col-span-2">
          <SessionManager sessions={activeSessions.map(s => ({ ...s, _id: s._id?.toString() }))} />
        </div>
      </div>
    </div>
  );
}

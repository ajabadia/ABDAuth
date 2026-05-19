import { getTranslations } from 'next-intl/server';
import { MfaControl } from '@/components/dashboard/security/MfaControl';
import { PasswordManager } from '@/components/dashboard/security/PasswordManager';
import { SessionManager } from '@/components/dashboard/security/SessionManager';
import { auth } from '@/auth';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Key } from 'lucide-react';
import { MfaService } from '@/services/auth/MfaService';
import { SessionService } from '@/services/auth/SessionService';
import { userRepository } from '@/lib/repositories/UserRepository';
import type { IndustrialUser } from '@/types/auth';
import type { EntityId } from '@/lib/schemas/common';

export default async function SecurityPage() {
  const t = await getTranslations('dashboard.security');
  const d = await getTranslations('dashboard');
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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
        <div className="flex flex-col gap-2 w-full">
          {/* Monospace Breadcrumb */}
          <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-2">
            <Key size={14} className="text-primary animate-pulse" aria-hidden="true" />
            {d('control_console')} • {d('menu.security')}
          </div>
          
          {/* Fila de Título e Interacción */}
          <div className="flex items-center gap-4 mt-1">
            <Link
              href="/dashboard"
              aria-label={d('back_to_dashboard')}
              className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <ArrowLeft size={14} />
            </Link>
            <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none flex-1 truncate">
              {t('title')}
            </h1>
          </div>
          
          <p className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
            {t('description')}
          </p>
        </div>
      </header>

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

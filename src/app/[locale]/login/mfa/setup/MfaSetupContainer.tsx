"use client";

/**
 * @purpose Gestiona el proceso de configuración de Multi-Factor Authentication (MFA), incluyendo manejo de sincronización y saltos de gracia.
 * @purpose_en ** Manages the Multi-Factor Authentication (MFA) setup process, including handling MFA enforcement synchronization and skipping grace periods.
 * @refactorable ** true (contains too many state variables and UI parts)
 * @classification ** UI Component
 * @complexity ** Medium
 * @fingerprint exports:1,imports:9,sig:en70qa
 * @lastUpdated 2026-06-21T10:26:19.374Z
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { MfaControl } from '@/components/dashboard/security/MfaControl';
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { syncMfaEnforcementAction, skipMfaGraceAction } from '@/services/auth/security-actions';
import { toast } from 'sonner';

interface MfaSetupContainerProps {
  t: {
    title: string;
    description: string;
    cancel_logout: string;
  };
  isMandatory: boolean;
  needsSync: boolean;
  isAuthenticated: boolean;
  mfaGracePeriodActive?: boolean;
  mfaGraceLoginsRemaining?: number;
  mfaGraceExpiresAt?: string;
}

export function MfaSetupContainer({ 
  t, 
  isMandatory, 
  needsSync, 
  isAuthenticated,
  mfaGracePeriodActive,
  mfaGraceLoginsRemaining = 0,
  mfaGraceExpiresAt = ''
}: MfaSetupContainerProps) {
  const router = useRouter();
  const skipTranslations = useTranslations('login.mfa_setup');
  const [skipping, setSkipping] = React.useState(false);

  React.useEffect(() => {
    if (needsSync) {
      const syncSession = async () => {
        try {
          await syncMfaEnforcementAction();
          router.push('/dashboard');
          router.refresh();
        } catch {
          toast.error('SESSION_SYNC_FAILURE', {
            description: 'Failed to synchronize security state'
          });
        }
      };
      syncSession();
    }
  }, [needsSync, router]);

  const handleComplete = () => {
    router.push('/dashboard');
    router.refresh();
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      const result = await skipMfaGraceAction();
      if (result.success) {
        toast.success(skipTranslations('skip_grace', { count: result.remainingLogins ?? 0 }));
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to skip MFA');
      }
    } catch {
      toast.error('Failed to process grace period request');
    } finally {
      setSkipping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">


      <div className="w-full max-w-2xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 text-amber-600 rounded-sm border border-amber-500/20 mb-2">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-[0.05em] text-foreground uppercase">
            {t.title}
          </h1>
          <p className="text-[11px] text-muted-foreground max-w-md mx-auto font-bold leading-relaxed uppercase tracking-widest opacity-80">
            {t.description}
          </p>
        </div>

        {mfaGracePeriodActive && mfaGraceLoginsRemaining > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-none space-y-3 animate-in fade-in duration-500">
            <p className="text-[11px] font-mono text-amber-500 tracking-wider text-center uppercase font-black">
              {skipTranslations('grace_banner', { count: mfaGraceLoginsRemaining, expiry: mfaGraceExpiresAt })}
            </p>
            <div className="flex justify-center">
              <Button
                onClick={handleSkip}
                disabled={skipping}
                className="bg-amber-500 hover:bg-amber-600 text-black rounded-none uppercase font-mono font-black text-[9px] tracking-[0.2em] h-10 px-6 active:scale-[0.98] transition-all shadow-none"
              >
                {skipping ? 'Sincronizando...' : skipTranslations('skip_grace', { count: mfaGraceLoginsRemaining })}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-card rounded-sm border border-border shadow-none overflow-hidden">
          <MfaControl 
            isActive={false} 
            isMandatory={isMandatory}
            initialStep="SETUP" 
            onComplete={handleComplete}
          />
        </div>

        <div className="flex justify-center pt-2">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground gap-2 font-black uppercase tracking-[0.2em] text-[9px] h-10 px-6 rounded-none font-mono"
            onClick={async () => { await authClient.signOut(); window.location.href = '/login'; }}
          >
            <LogOut size={14} />
            {t.cancel_logout}
          </Button>
        </div>
      </div>
    </div>
  );
}

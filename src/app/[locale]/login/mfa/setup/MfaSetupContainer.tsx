"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { MfaControl } from '@/components/dashboard/security/MfaControl';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { SystemSettings } from '@/components/ui/SystemSettings';

import { syncMfaEnforcementAction } from '@/services/auth/security-actions';
import { toast } from 'sonner';

interface MfaSetupContainerProps {
  t: {
    title: string;
    description: string;
    cancel_logout: string;
  };
  isMandatory: boolean;
  needsSync: boolean;
}

export function MfaSetupContainer({ t, isMandatory, needsSync }: MfaSetupContainerProps) {
  const router = useRouter();

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="fixed top-6 right-6 z-50">
        <SystemSettings />
      </div>

      <div className="w-full max-w-2xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20 mb-2">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-[0.05em] text-foreground uppercase">
            {t.title}
          </h1>
          <p className="text-[11px] text-muted-foreground max-w-md mx-auto font-bold leading-relaxed uppercase tracking-widest opacity-80">
            {t.description}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-none overflow-hidden">
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
            className="text-muted-foreground hover:text-foreground gap-2 font-black uppercase tracking-[0.2em] text-[9px] h-10 px-6 rounded-lg"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut size={14} />
            {t.cancel_logout}
          </Button>
        </div>
      </div>
    </div>
  );
}

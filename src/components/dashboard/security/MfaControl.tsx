"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence } from 'framer-motion';
import { setupMfaAction, enableMfaAction, disableMfaAction } from '@/services/auth/security-actions';
import { toast } from 'sonner';
import { MfaHeader } from './sections/MfaHeader';
import { MfaIdleState } from './sections/MfaIdleState';
import { MfaSetupState } from './sections/MfaSetupState';
import { MfaRecoveryState } from './sections/MfaRecoveryState';

interface MfaControlProps {
  isActive: boolean;
  isMandatory?: boolean;
  initialStep?: 'IDLE' | 'SETUP' | 'RECOVERY';
  onComplete?: () => void;
}

export function MfaControl({ isActive, isMandatory = false, initialStep = 'IDLE', onComplete }: MfaControlProps) {
  const t = useTranslations('dashboard.security.mfa');
  const [enabled, setEnabled] = useState(isActive);
  const [step, setStep] = useState<'IDLE' | 'SETUP' | 'RECOVERY'>(initialStep);
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string, qrCode: string } | null>(null);
  const [token, setToken] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  
  useEffect(() => {
    if (initialStep === 'SETUP' && !setupData && !loading) {
      handleStartSetup();
    }
  }, [initialStep]);

  useEffect(() => {
    if (enabled && step === 'IDLE' && initialStep === 'SETUP') {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [enabled, step, initialStep, onComplete]);

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const data = await setupMfaAction();
      setSetupData(data);
      setStep('SETUP');
    } catch {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!setupData || token.length < 6) return;
    setLoading(true);
    try {
      const result = await enableMfaAction(setupData.secret, token);
      if (result.success) {
        setEnabled(true);
        setRecoveryCodes(result.backupCodes);
        setStep('RECOVERY');
        toast.success(t('status_active'));
      } else {
        toast.error('Invalid token');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm(t('disable'))) return;
    setLoading(true);
    try {
      await disableMfaAction();
      setEnabled(false);
      setStep('IDLE');
      toast.success(t('status_inactive'));
    } catch {
      toast.error('Error disabling MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast.success(t('copy_codes'));
  };

  return (
    <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-none transition-all duration-300">
      <MfaHeader enabled={enabled} t={t} />

      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === 'IDLE' && (
            <MfaIdleState 
              enabled={enabled}
              initialStep={initialStep}
              isMandatory={isMandatory}
              loading={loading}
              t={t}
              onStartSetup={handleStartSetup}
              onDisable={handleDisable}
              onComplete={onComplete}
            />
          )}

          {step === 'SETUP' && setupData && (
            <MfaSetupState 
              setupData={setupData}
              token={token}
              loading={loading}
              t={t}
              setToken={setToken}
              onVerify={handleVerify}
              onCancel={() => setStep('IDLE')}
            />
          )}

          {step === 'RECOVERY' && (
            <MfaRecoveryState 
              recoveryCodes={recoveryCodes}
              t={t}
              onCopy={handleCopyCodes}
              onDone={() => {
                setStep('IDLE');
                onComplete?.();
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

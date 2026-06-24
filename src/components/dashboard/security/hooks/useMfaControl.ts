'use client';

/**
 * @purpose Gestiona el proceso de configuración, verificación y desactivación de autenticación multifactor.
 * @purpose_en Manages Multi-Factor Authentication (MFA) setup, verification, and disabling processes.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Custom Hook
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:m9nyro
 * @lastUpdated 2026-06-21T12:04:02.458Z
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { useConfirmDialog } from '@ajabadia/ecosystem-widgets';

export function useMfaControl(isActive: boolean, initialStep: 'IDLE' | 'SETUP' | 'RECOVERY' = 'IDLE', onComplete?: () => void) {
  const [enabled, setEnabled] = useState(isActive);
  const [step, setStep] = useState<'IDLE' | 'SETUP' | 'RECOVERY'>(initialStep);
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<{ totpURI: string, backupCodes: string[] } | null>(null);
  const [token, setToken] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    if (initialStep === 'SETUP' && !setupData && !loading) {
      handleStartSetup();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const { data, error } = await authClient.twoFactor.enable({});
      if (error) {
        toast.error(error.message || 'Failed to setup MFA');
        return;
      }
      if (data) {
        setSetupData({ totpURI: data.totpURI, backupCodes: data.backupCodes });
        setStep('SETUP');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = useCallback(async () => {
    if (!setupData || token.length < 6) return;
    setLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({ code: token });
      if (error) {
        toast.error(error.message || 'Invalid token');
        return;
      }
      if (data) {
        setEnabled(true);
        setRecoveryCodes(setupData.backupCodes);
        setStep('RECOVERY');
        toast.success('MFA activated');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }, [setupData, token]);

  const disableMfaDialog = useConfirmDialog({
    onConfirm: async () => {
      try {
        const { error } = await authClient.twoFactor.disable({});
        if (error) {
          toast.error(error.message || 'Error disabling MFA');
          return;
        }
        setEnabled(false);
        setStep('IDLE');
        toast.success('MFA deactivated');
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Error disabling MFA');
      }
    },
  });

  const handleDisable = useCallback(() => {
    disableMfaDialog.trigger();
  }, [disableMfaDialog]);

  const handleCopyCodes = useCallback(() => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast.success('Recovery codes copied');
  }, [recoveryCodes]);

  return {
    enabled,
    step,
    loading,
    setupData,
    token,
    setToken,
    recoveryCodes,
    disableMfaDialog,
    handleStartSetup,
    handleVerify,
    handleDisable,
    handleCopyCodes,
    setStep,
  };
}

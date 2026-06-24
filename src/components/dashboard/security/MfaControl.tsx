"use client";

/**
 * @purpose Gestiona y renderiza el panel de control de Autenticación Multifactor (MFA), incluyendo configuración, recuperación y deshabilitar MFA.
 * @purpose_en Renders and manages the Multi-Factor Authentication (MFA) control panel, including setup, recovery, and disabling MFA.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:9,sig:1vvnc3v
 * @lastUpdated 2026-06-21T12:04:11.320Z
 */

import React from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '@ajabadia/ecosystem-widgets';
import { useMfaControl } from './hooks/useMfaControl';
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
  const {
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
  } = useMfaControl(isActive, initialStep, onComplete);

  return (
    <div className="relative bg-card border border-border rounded-none overflow-hidden shadow-none transition-all duration-300">
      <MfaHeader enabled={enabled} t={t} />

      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === 'IDLE' && (
            <MfaIdleState 
              enabled={enabled}
              initialStep={initialStep}
              isMandatory={isMandatory}
              loading={loading || disableMfaDialog.isLoading}
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
      <ConfirmDialog
        open={disableMfaDialog.open}
        title={t('disable') || "DESACTIVAR MFA"}
        message={t('disable') || "¿Estás seguro de que deseas desactivar la autenticación de doble factor?"}
        confirmLabel="DESACTIVAR"
        cancelLabel="CANCELAR"
        variant="danger"
        isLoading={disableMfaDialog.isLoading}
        onConfirm={disableMfaDialog.confirm}
        onCancel={disableMfaDialog.cancel}
      />
    </div>
  );
}

'use client';

/**
 * @purpose Gestiona un seccion para el manejo de códigos de recuperación de autenticación multifactor, incluyendo mostrar los códigos, copiarlos y marcar el proceso como terminado.
 * @purpose_en Renders a section for managing Multi-Factor Authentication recovery codes, including displaying the codes, copying them, and marking the process as done.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:87fel4
 * @lastUpdated 2026-06-21T12:04:32.570Z
 */

import { motion } from 'framer-motion';
import { CheckCircle2, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MfaRecoveryStateProps {
  recoveryCodes: string[];
  t: (key: string) => string;
  onCopy: () => void;
  onDone: () => void;
}

export function MfaRecoveryState({ 
  recoveryCodes, 
  t, 
  onCopy, 
  onDone 
}: MfaRecoveryStateProps) {
  return (
    <motion.div 
      key="recovery"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-none flex items-start gap-4">
        <CheckCircle2 className="text-emerald-500 mt-1 shrink-0" size={24} />
        <div className="space-y-1">
          <h3 className="font-bold text-emerald-500 text-sm tracking-tight">{t('backup_codes_title')}</h3>
          <h4 className="text-xs text-muted-foreground leading-relaxed">{t('backup_codes_desc')}</h4>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-muted/20 p-4 rounded-none border border-border">
        {recoveryCodes.map(code => (
          <div key={code} className="p-2.5 rounded-sm bg-card border border-border/40 text-center font-mono text-[10px] font-bold text-foreground/70 hover:border-primary/30 transition-colors uppercase tracking-wider">
            {code}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1 h-12 gap-3 font-bold text-[10px] uppercase tracking-[0.2em] border-border hover:bg-muted"
          onClick={onCopy}
        >
          <ClipboardCheck size={16} className="text-primary" />
          {t('copy_codes')}
        </Button>
        <Button 
          className="bg-primary text-primary-foreground h-12 px-10 font-black text-[9px] uppercase tracking-[0.2em] shadow-none rounded-none" 
          onClick={onDone}
        >
          {t('done_btn')}
        </Button>
      </div>
    </motion.div>
  );
}

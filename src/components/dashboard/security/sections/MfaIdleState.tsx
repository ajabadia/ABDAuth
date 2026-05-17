'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MfaIdleStateProps {
  enabled: boolean;
  initialStep: string;
  isMandatory: boolean;
  loading: boolean;
  t: (key: string) => string;
  onStartSetup: () => void;
  onDisable: () => void;
  onComplete?: () => void;
}

export function MfaIdleState({ 
  enabled, 
  initialStep, 
  isMandatory, 
  loading, 
  t, 
  onStartSetup, 
  onDisable, 
  onComplete 
}: MfaIdleStateProps) {
  return (
    <motion.div 
      key="idle"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col md:flex-row items-center gap-10"
    >
      <div className="flex-shrink-0">
        <div className={`w-24 h-24 rounded-xl border flex items-center justify-center transition-colors duration-500 ${
          enabled 
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
            : 'bg-muted/30 border-border text-muted-foreground'
        }`}>
          {enabled ? <ShieldCheck size={40} /> : <ShieldAlert size={40} />}
        </div>
      </div>
      
      <div className="flex-1 text-center md:text-left space-y-6">
        <p className="text-[11px] text-muted-foreground leading-relaxed font-bold uppercase tracking-widest opacity-80">
          {enabled ? t('info_active') : t('info_inactive')}
        </p>
        {enabled ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              {initialStep === 'SETUP' && (
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-10 font-black uppercase tracking-[0.2em] text-[9px] rounded-lg shadow-none"
                  onClick={() => onComplete?.()}
                >
                  {t('done_btn')}
                </Button>
              )}

              {!isMandatory ? (
                <Button 
                  variant="outline" 
                  className="border-destructive/20 text-destructive hover:bg-destructive/5 h-10 px-8 font-black uppercase tracking-[0.2em] text-[9px] rounded-lg shadow-none"
                  onClick={onDisable}
                  disabled={loading}
                >
                  {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                  {t('disable')}
                </Button>
              ) : (
                <div className="flex items-center gap-2 px-2 py-0.5 bg-amber-500/5 border border-amber-500/10 rounded">
                  <ShieldAlert size={12} className="text-amber-500" />
                  <span className="text-[8px] font-mono font-bold text-amber-500 uppercase tracking-tighter">
                    {t('mandatory_notice')}
                  </span>
                </div>
              )}
            </div>
            {initialStep === 'SETUP' && (
              <p className="text-[8px] font-black text-emerald-500/60 uppercase tracking-[0.2em] animate-pulse">
                {t('redirecting_notice')}
              </p>
            )}
          </div>
        ) : (
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-8 gap-3 font-black uppercase tracking-[0.2em] text-[9px] rounded-lg shadow-none"
            onClick={onStartSetup}
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : <QrCode size={16} />}
            {t('enable')}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

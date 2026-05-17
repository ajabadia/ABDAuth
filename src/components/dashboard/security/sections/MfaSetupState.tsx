'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MfaSetupStateProps {
  setupData: { secret: string, qrCode: string };
  token: string;
  loading: boolean;
  t: (key: string) => string;
  setToken: (token: string) => void;
  onVerify: () => void;
  onCancel: () => void;
}

export function MfaSetupState({ 
  setupData, 
  token, 
  loading, 
  t, 
  setToken, 
  onVerify, 
  onCancel 
}: MfaSetupStateProps) {
  return (
    <motion.div 
      key="setup"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="p-4 bg-white rounded-xl shadow-inner border border-border mx-auto lg:mx-0">
          <img src={setupData.qrCode} alt="QR" className="w-40 h-40" />
        </div>
        <div className="flex-1 space-y-5 w-full">
          <div className="space-y-3">
            <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground text-[10px]">1</span>
              {t('setup_step1')}
            </h3>
            <div className="p-4 bg-muted/50 rounded-xl border border-border group hover:border-primary/40 transition-colors">
              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">{t('manual_key')}</p>
              <code className="text-xs font-mono text-primary select-all break-all">{setupData.secret}</code>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground text-[10px]">2</span>
              {t('setup_step2')}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="000 000"
                className="max-w-[150px] h-12 font-mono text-center text-xl tracking-[0.3em] bg-muted/30 border-border focus:ring-primary/20 rounded-lg"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoFocus
              />
              <Button
                onClick={onVerify}
                disabled={loading || token.length < 6}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 flex-1 font-black uppercase tracking-[0.2em] text-[9px] rounded-lg shadow-none"
              >
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                {t('verify_btn')}
              </Button>
              <Button variant="ghost" className="h-12 px-4 text-muted-foreground hover:text-foreground" onClick={onCancel}>{t('cancel')}</Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

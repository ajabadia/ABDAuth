'use client';

/**
 * @purpose Renderiza el estado de configuración de autenticación multi-faceta con código QR y campos de entrada manual.
 * @purpose_en Renders a multi-factor authentication setup state with QR code and input fields for manual entry.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:3mrujd
 * @lastUpdated 2026-06-21T12:04:36.729Z
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface MfaSetupStateProps {
  setupData: { totpURI: string, backupCodes: string[] };
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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(setupData.totpURI, {
      width: 160,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    }).then(setQrDataUrl).catch(console.error);
  }, [setupData.totpURI]);

  // Extract the manual secret key from the otpauth URI for manual entry
  const secretKey = setupData.totpURI?.match(/secret=([A-Za-z2-7]+=*)/i)?.[1] || '';

  return (
    <motion.div 
      key="setup"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="p-4 bg-card rounded-none shadow-inner border border-border mx-auto lg:mx-0">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="TOTP QR Code" className="w-40 h-40" />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center text-muted-foreground text-[9px] uppercase tracking-wider font-bold">
              Generating…
            </div>
          )}
        </div>
        <div className="flex-1 space-y-5 w-full">
          <div className="space-y-3">
            <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-sm bg-primary text-primary-foreground text-[10px]">1</span>
              {t('setup_step1')}
            </h3>
            <div className="p-4 bg-muted/50 rounded-none border border-border group hover:border-primary/40 transition-colors">
              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">{t('manual_key')}</p>
              <code className="text-xs font-mono text-primary select-all break-all">{secretKey || setupData.totpURI}</code>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-sm bg-primary text-primary-foreground text-[10px]">2</span>
              {t('setup_step2')}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="000 000"
                className="max-w-[150px] h-12 font-mono text-center text-xl tracking-[0.3em] bg-muted/30 border-border focus:ring-primary/20 rounded-none"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
              <Button
                onClick={onVerify}
                disabled={loading || token.length < 6}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 flex-1 font-black uppercase tracking-[0.2em] text-[9px] rounded-none shadow-none"
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

/**
 * @purpose Renderiza un elemento de sesión en el panel de control, mostrando información del dispositivo y última hora de actividad, con la opción de revocar la sesión.
 * @purpose_en Renders a session item in the dashboard, displaying device information and last active time, with an option to revoke the session.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:1nrqw3r
 * @lastUpdated 2026-06-21T12:03:58.206Z
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Tablet, XCircle, MapPin, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useFormatter, useNow } from 'next-intl';

interface Session {
  _id?: string;
  ip?: string;
  userAgent?: string;
  device?: {
    browser?: string;
    os?: string;
    type: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';
  };
  lastActive: Date | string;
  isCurrent: boolean;
}

interface SessionItemProps {
  session: Session;
  loadingId: string | null;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  format: ReturnType<typeof useFormatter>;
  now: ReturnType<typeof useNow>;
  onRevoke: (id?: string) => void;
}

export function SessionItem({
  session,
  loadingId,
  t,
  format,
  now,
  onRevoke
}: SessionItemProps) {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'MOBILE': return <Smartphone size={20} />;
      case 'TABLET': return <Tablet size={20} />;
      default: return <Monitor size={20} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-5 flex items-center justify-between hover:bg-muted/30 transition-all group"
    >
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-sm transition-all duration-500 ${session.isCurrent ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground group-hover:bg-card group-hover:border-border'}`}>
          {getDeviceIcon(session.device?.type || 'UNKNOWN')}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
             <span className="font-bold text-sm text-foreground tracking-tight">
              {t('browser_on_os', {
                browser: session.device?.browser || t('browser_unknown'),
                os: session.device?.os || t('os_unknown')
              })}
            </span>
            {session.isCurrent && (
              <span className="px-2 py-0.5 rounded-sm bg-primary/10 text-primary text-[9px] font-black tracking-[0.2em]">
                {t('current').toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground font-medium">
            <span className="flex items-center gap-2">
              <MapPin size={13} className="text-primary/60" /> {session.ip}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={13} className="text-primary/60" /> 
              {format.relativeTime(new Date(session.lastActive), now)}
            </span>
          </div>
        </div>
      </div>

      {!session.isCurrent && (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-sm transition-all"
          onClick={() => onRevoke(session._id)}
          disabled={loadingId === session._id}
        >
          {loadingId === session._id ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <XCircle size={20} />
          )}
        </Button>
      )}
    </motion.div>
  );
}

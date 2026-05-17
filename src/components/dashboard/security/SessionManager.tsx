"use client";

import React, { useState } from 'react';
import { useTranslations, useFormatter, useNow } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Tablet, XCircle, MapPin, Clock, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { revokeSessionAction, revokeAllOtherSessionsAction } from '@/services/auth/security-actions';

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

interface SessionManagerProps {
  sessions: Session[];
}

export function SessionManager({ sessions: initialSessions }: SessionManagerProps) {
  const t = useTranslations('dashboard.security.sessions');
  const format = useFormatter();
  const now = useNow();
  
  const [sessions, setSessions] = useState(initialSessions);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRevoke = async (id?: string) => {
    if (!id) return;
    setLoadingId(id);
    try {
      await revokeSessionAction(id);
      setSessions(prev => prev.filter(s => s._id !== id));
      notify("Sesión revocada");
    } catch {
      notify("Error al revocar", 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleRevokeOthers = async () => {
    if (!confirm(t('revoke_all'))) return;
    setLoadingId('ALL');
    try {
      await revokeAllOtherSessionsAction();
      setSessions(prev => prev.filter(s => s.isCurrent));
      notify("Sesiones remotas cerradas");
    } catch {
      notify("Error al revocar sesiones", 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'MOBILE': return <Smartphone size={20} />;
      case 'TABLET': return <Tablet size={20} />;
      default: return <Monitor size={20} />;
    }
  };

  return (
    <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all duration-300 h-fit">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 10 }}
            exit={{ opacity: 0 }}
            className={`absolute top-0 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-[10px] font-bold shadow-lg border ${
              notification.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 backdrop-blur-md' 
                : 'bg-destructive/10 text-destructive border-destructive/20 backdrop-blur-md'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Monitor size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{t('title')}</h2>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{t('subtitle')}</p>
          </div>
        </div>
        {sessions.length > 1 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:bg-destructive/10 text-[10px] h-9 font-bold uppercase tracking-widest gap-2"
            onClick={handleRevokeOthers}
            disabled={loadingId === 'ALL'}
          >
            {loadingId === 'ALL' ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={14} />}
            {t('revoke_all')}
          </Button>
        )}
      </div>

      <div className="divide-y divide-border/40">
        <AnimatePresence initial={false}>
          {sessions.map((session) => (
            <motion.div 
              key={session._id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-5 flex items-center justify-between hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-xl transition-all duration-500 ${session.isCurrent ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground group-hover:bg-card group-hover:border-border'}`}>
                  {getDeviceIcon(session.device?.type || 'UNKNOWN')}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-foreground tracking-tight">
                      {session.device?.browser || 'Navegador'} en {session.device?.os || 'OS'}
                    </span>
                    {session.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black tracking-[0.2em]">
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
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-lg transition-all"
                  onClick={() => handleRevoke(session._id)}
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
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

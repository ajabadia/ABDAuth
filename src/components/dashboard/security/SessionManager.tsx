"use client";

/**
 * @purpose Gestiona y renderiza una lista de sesiones de usuario, permitiendo a los usuarios revocar individualmente o todas las otras sesiones.
 * @purpose_en Manages and renders a list of user sessions, allowing users to revoke individual or all other sessions.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:9,sig:1arwv2a
 * @lastUpdated 2026-06-21T12:04:41.708Z
 */

import React, { useState } from 'react';
import { useTranslations, useFormatter, useNow } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, useConfirmDialog } from '@ajabadia/ecosystem-widgets';
import { useSessionNotification } from './hooks/useSessionNotification';
import { revokeSessionAction, revokeAllOtherSessionsAction } from '@/services/auth/security-actions';
import { SessionItem } from './components/SessionItem';

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
  const { notification, notify } = useSessionNotification();

  const handleRevoke = async (id?: string) => {
    if (!id) return;
    setLoadingId(id);
    try {
      await revokeSessionAction(id);
      setSessions(prev => prev.filter(s => s._id !== id));
      notify(t('revoke'));
    } catch {
      notify(t('revoke'), 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const revokeAllDialog = useConfirmDialog({
    onConfirm: async () => {
      setLoadingId('ALL');
      try {
        await revokeAllOtherSessionsAction();
        setSessions(prev => prev.filter(s => s.isCurrent));
        notify(t('revoke_all'));
      } catch {
        notify(t('revoke'), 'error');
      } finally {
        setLoadingId(null);
      }
    },
  });

  const handleRevokeOthers = () => {
    revokeAllDialog.trigger();
  };

  return (
    <div className="relative bg-card border border-border rounded-sm overflow-hidden shadow-sm transition-all duration-300 h-fit">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 10 }}
            exit={{ opacity: 0 }}
            className={`absolute top-0 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-none text-[10px] font-bold shadow-lg border ${
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
          <div className="p-2 bg-primary/10 text-primary rounded-sm">
            <Monitor size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">{t('title')}</h2>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{t('subtitle')}</p>
          </div>
        </div>
        {sessions.length > 1 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:bg-destructive/10 text-[10px] h-9 font-bold uppercase tracking-widest gap-2 rounded-sm"
            onClick={handleRevokeOthers}
            disabled={loadingId === 'ALL' || revokeAllDialog.isLoading}
          >
            {(loadingId === 'ALL' || revokeAllDialog.isLoading) ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={14} />}
            {t('revoke_all')}
          </Button>
        )}
      </div>

      <div className="divide-y divide-border/40">
        <AnimatePresence initial={false}>
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <SessionItem 
                key={session._id}
                session={session}
                loadingId={loadingId}
                t={t}
                format={format}
                now={now}
                onRevoke={handleRevoke}
              />
            ))
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest bg-muted/10">
              {t('no_sessions')}
            </div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={revokeAllDialog.open}
        title={t('revoke_all') || "REVOCAR SESIONES"}
        message={t('revoke_all') || "¿Estás seguro de que deseas revocar todas las demás sesiones activas?"}
        confirmLabel="REVOCAR"
        cancelLabel="CANCELAR"
        variant="danger"
        isLoading={revokeAllDialog.isLoading}
        onConfirm={revokeAllDialog.confirm}
        onCancel={revokeAllDialog.cancel}
      />
    </div>
  );
}

/**
 * @purpose Renderiza un formulario para cambiar la contraseña del usuario, incluyendo campos para la contraseña actual, nueva contraseña y confirmación de la nueva contraseña.
 * @purpose_en Renders a form for changing user passwords, including fields for the current password, new password, and confirmation of the new password.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:syx5ad
 * @lastUpdated 2026-06-21T12:03:52.937Z
 */

import * as React from 'react';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

interface PasswordFieldsProps {
  currentPass: string;
  setCurrentPass: (val: string) => void;
  newPass: string;
  setNewPass: (val: string) => void;
  confirmPass: string;
  setConfirmPass: (val: string) => void;
  t: (key: string) => string;
}

export function PasswordFields({
  currentPass,
  setCurrentPass,
  newPass,
  setNewPass,
  confirmPass,
  setConfirmPass,
  t
}: PasswordFieldsProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Lock size={12} />
          {t('current_label')}
        </label>
        <input
          type="password"
          value={currentPass}
          onChange={(e) => setCurrentPass(e.target.value)}
          autoComplete="current-password"
          className="w-full bg-muted/30 border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all font-mono text-foreground"
          placeholder="••••••••"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ShieldCheck size={12} />
            {t('new_label')}
          </label>
          <input
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            autoComplete="new-password"
            className="w-full bg-muted/30 border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all font-mono text-foreground"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <AlertCircle size={12} />
            {t('confirm_label')}
          </label>
          <input
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            autoComplete="new-password"
            className="w-full bg-muted/30 border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all font-mono text-foreground"
            placeholder="••••••••"
            required
          />
        </div>
      </div>
    </>
  );
}

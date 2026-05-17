'use client';

import { X, Save, Loader2 } from "lucide-react";
import type { UserManagementTranslations } from "../types";

interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  t: UserManagementTranslations;
}

export function FormActions({ onCancel, isSubmitting, t }: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border/50 mt-8">
      <button 
        type="button" 
        onClick={onCancel}
        aria-label={t.form.cancel}
        className="px-6 h-11 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        disabled={isSubmitting}
      >
        <X size={14} />
        {t.form.cancel}
      </button>
      <button 
        type="submit" 
        disabled={isSubmitting}
        aria-label={t.form.save}
        className="px-8 h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isSubmitting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        {t.form.save}
      </button>
    </div>
  );
}

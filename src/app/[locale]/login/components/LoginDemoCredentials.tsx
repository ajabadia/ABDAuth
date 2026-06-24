/**
 * @purpose Renderiza un componente que muestra credenciales de inicio de sesión de demo y texto del pie de página.
 * @purpose_en Renders a component displaying demo login credentials and footer text.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:12n4hha
 * @lastUpdated 2026-06-21T10:24:16.377Z
 */

import { CheckCircle } from "lucide-react";

interface LoginDemoCredentialsProps {
  demoTitle: string;
  demoUser: string;
  demoPass: string;
  footerText: string;
}

export function LoginDemoCredentials({ demoTitle, demoUser, demoPass, footerText }: LoginDemoCredentialsProps) {
  return (
    <>
      {/* 📟 Lab Credentials (Demo) */}
      <div className="mt-8 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity relative z-10">
        <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-[0.2em]">{demoTitle}</span>
        <div className="flex gap-4">
          <div className="text-[9px] font-mono bg-secondary/40 px-2.5 py-1 rounded-none border border-border select-all">{demoUser}</div>
          <div className="text-[9px] font-mono bg-secondary/40 px-2.5 py-1 rounded-none border border-border select-all">{demoPass}</div>
        </div>
      </div>

      {/* 🏁 Footer Specs */}
      <footer className="mt-auto py-8 flex items-center gap-6 opacity-20 relative z-10">
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-[0.2em] uppercase">
          <CheckCircle size={10} className="text-emerald-500" />
          {footerText}
        </div>
      </footer>
    </>
  );
}

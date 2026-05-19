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
      <div className="mt-8 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{demoTitle}</span>
        <div className="flex gap-4">
          <div className="text-[9px] font-mono bg-secondary px-2 py-1 rounded-sm border border-border">{demoUser}</div>
          <div className="text-[9px] font-mono bg-secondary px-2 py-1 rounded-sm border border-border">{demoPass}</div>
        </div>
      </div>

      {/* 🏁 Footer Specs */}
      <footer className="mt-auto py-8 flex items-center gap-6 opacity-20">
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-tight uppercase">
          <CheckCircle size={10} className="text-emerald-500" />
          {footerText}
        </div>
      </footer>
    </>
  );
}

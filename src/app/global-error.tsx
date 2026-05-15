'use client';

import { ShieldAlert, RefreshCw } from 'lucide-react';

/**
 * 🚨 GLOBAL_ERROR_BOUNDARY
 * PATH: src/app/global-error.tsx
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const title = 'Critical System Error';
  const subtitle = 'Orchestration Failure · Breach Detected';
  const unknownMsg = 'Unknown error in identity engine.';
  const resetLabel = 'Restart Protocol';

  return (
    <html lang="es">
      <body className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center p-6 selection:bg-red-500/30">
        <div className="max-w-md w-full bg-card border border-red-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl -mr-16 -mt-16" />
          
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 animate-pulse">
              <ShieldAlert size={32} className="text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight uppercase">{title}</h2>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em]">
                {subtitle}
              </p>
            </div>

            <div className="w-full bg-black/40 border border-border/50 rounded-lg p-4 font-mono text-[10px] text-red-400 overflow-auto max-h-32 text-left">
              <code>{error.message || unknownMsg}</code>
              {error.digest && (
                <p className="mt-2 text-muted-foreground opacity-50 text-[8px]">
                  DIGEST: {error.digest}
                </p>
              )}
            </div>

            <button
              aria-label="Restart protocol"
              onClick={() => reset()}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
            >
              <RefreshCw size={14} />
              {resetLabel}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

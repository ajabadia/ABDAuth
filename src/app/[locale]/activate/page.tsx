'use client';

/**
 * @purpose Renderiza una página para activar un account utilizando un token, contraseña y ID del inquilino.
 * @purpose_en Renders a page for activating an account using a token, password, and tenant ID.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:8,sig:1s23jst
 * @lastUpdated 2026-06-21T10:18:33.787Z
 */

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { toast } from "sonner";
import { activateAccountAction } from "./actions";
import { Lock, ArrowRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function ActivatePage() {
  const t = useTranslations('common');
  const router = useRouter();
  
  const [token, setToken] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tkn = params.get('token');
    const tid = params.get('tenantId');
    if (tkn) setToken(tkn);
    if (tid) setTenantId(tid);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append('token', token);
    formData.append('password', password);
    formData.append('tenantId', tenantId);

    try {
      const result = await activateAccountAction(formData);

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Cuenta activada", {
          description: "Redirigiendo al login..."
        });
        
        setTimeout(() => {
          router.push(`/login`);
        }, 1500);
      }
    } catch (err: unknown) {
      setError("Ocurrió un error inesperado");
      toast.error("Error al activar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground selection:bg-primary/30 overflow-hidden relative" role="main">
      <div className="absolute inset-0 z-0 bg-industrial-grid mask-industrial-fade opacity-50 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-md bg-card/80 backdrop-blur-md border border-border p-8 rounded-none shadow-2xl relative group">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 p-4">
          <span className="font-mono text-xs opacity-20 group-hover:opacity-100 transition-opacity text-primary animate-pulse">SYS_ACTIVATION</span>
        </div>

        <div className="mb-8 mt-2">
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none">
            Activación
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-mono uppercase tracking-widest text-[10px]">
            Establece tu contraseña maestra
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-[10px] font-black uppercase tracking-wider animate-in fade-in rounded-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Contraseña
            </Label>
            <div className="relative group/input">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within/input:text-primary transition-colors z-10" />
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 pl-10 rounded-sm bg-secondary/30 border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">
              Confirmar Contraseña
            </Label>
            <div className="relative group/input">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within/input:text-primary transition-colors z-10" />
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 pl-10 rounded-sm bg-secondary/30 border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="mt-4 w-full inline-flex items-center justify-center gap-3 px-5 py-3 bg-primary text-primary-foreground border border-primary/30 font-mono text-[11px] font-black uppercase tracking-widest transition-all duration-300 rounded-sm hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? "Procesando..." : "ACTIVAR CUENTA"}
            {!isLoading && <ArrowRight className="w-4 h-4 animate-pulse" />}
          </button>
        </form>
      </div>
    </main>
  );
}

/**
 * @purpose Renderiza una tarjeta que muestra credenciales de aplicación con opciones para revelar el secreto del cliente.
 * @purpose_en Renders a card displaying application credentials with options to reveal the client secret.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:cuwdjc
 * @lastUpdated 2026-06-21T10:31:22.712Z
 */

import { Shield, Key } from "lucide-react"

interface ApplicationCredentialsCardProps {
  clientId: string
  clientSecret: string
  t: {
    client_id: string
    client_secret: string
    hover_reveal: string
  }
}

export function ApplicationCredentialsCard({ clientId, clientSecret, t }: ApplicationCredentialsCardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 bg-primary/5 p-4 rounded-none border border-primary/10">
      <div className="space-y-1.5">
        <label className="text-[9px] font-black uppercase tracking-widest text-primary/70 ml-1 flex items-center gap-1">
          <Key size={10} /> {t.client_id}
        </label>
        <input 
          readOnly
          value={clientId}
          className="w-full bg-black/20 border border-primary/20 rounded-none px-3 py-2 text-[10px] font-mono text-primary cursor-not-allowed"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[9px] font-black uppercase tracking-widest text-primary/70 ml-1 flex items-center gap-1">
          <Shield size={10} /> {t.client_secret}
        </label>
        <div className="relative group">
          <input 
            readOnly
            type="password"
            value={clientSecret}
            className="w-full bg-black/20 border border-primary/20 rounded-none px-3 py-2 text-[10px] font-mono text-primary cursor-not-allowed group-hover:blur-0 blur-sm transition-all"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 pointer-events-none transition-opacity text-[8px] font-black uppercase tracking-widest">
            {t.hover_reveal}
          </div>
        </div>
      </div>
    </div>
  )
}

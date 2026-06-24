'use client';

/**
 * @purpose Rendra un componente de tarjeta para mostrar y gestionar proveedores de identidad, incluyendo acciones como editar y eliminar.
 * @purpose_en Renders a card component for displaying and managing identity providers, including actions like editing and deleting.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1gtakwi
 * @lastUpdated 2026-06-21T10:32:09.798Z
 */

import * as React from 'react';
import { Shield, Edit2, Trash2, ExternalLink, Globe, CheckCircle, XCircle, Server, Key } from 'lucide-react';
import type { IdentityProviderDisplay, IdentityProviderTranslations } from './types';

interface IdentityProviderCardProps {
  provider: IdentityProviderDisplay;
  t: IdentityProviderTranslations;
  onEdit: (provider: IdentityProviderDisplay) => void;
  onDelete: (id: string) => void;
}

export function IdentityProviderCard({ provider, t, onEdit, onDelete }: IdentityProviderCardProps) {
  return (
    <div className="group relative border border-border/40 bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300 rounded-none">
      {/* Header */}
      <div className="p-4 border-b border-border/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 shrink-0 rounded-none ${provider.providerType === 'OIDC' ? 'bg-sky-500/10' : 'bg-amber-500/10'}`}>
              {provider.providerType === 'OIDC'
                ? <Globe size={18} className="text-sky-400" />
                : <Shield size={18} className="text-amber-400" />
              }
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{provider.name}</h3>
              {provider.description && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{provider.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-none ${
              provider.active
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {provider.active
                ? <CheckCircle size={10} className="fill-emerald-400/20" />
                : <XCircle size={10} className="fill-red-400/20" />
              }
              {provider.active ? t.active : t.inactive}
            </span>
            <span className={`px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase rounded-none ${
              provider.providerType === 'OIDC'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {provider.providerType === 'OIDC' ? t.oidc_label : t.saml_label}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Issuer / Entity ID */}
        <div className="flex items-center gap-2">
          <Server size={12} className="text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
              {provider.providerType === 'OIDC' ? t.cards.issuer : t.cards.entity_id}
            </span>
            <code className="text-[10px] font-mono text-foreground/70 truncate block">
              {provider.providerType === 'OIDC' ? provider.issuerUrl || '-' : provider.entityId || '-'}
            </code>
          </div>
        </div>

        {/* Client ID (OIDC) */}
        {provider.providerType === 'OIDC' && provider.clientId && (
          <div className="flex items-center gap-2">
            <Key size={12} className="text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">{t.cards.client_credentials}</span>
              <code className="text-[10px] font-mono text-foreground/70 truncate block">{provider.clientId}</code>
            </div>
          </div>
        )}

        {/* Allowed Domains */}
        {provider.allowedDomains && provider.allowedDomains.length > 0 && (
          <div className="flex items-center gap-2">
            <Globe size={12} className="text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">{t.cards.authorized_domains}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {provider.allowedDomains.map((domain, i) => (
                  <span key={i} className="px-1.5 py-0.5 text-[8px] font-mono bg-muted/50 border border-border/40 rounded-none text-muted-foreground">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex border-t border-border/20">
        <button
          aria-label={`Edit ${provider.name}`}
          onClick={() => onEdit(provider)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border-r border-border/20 cursor-pointer rounded-none"
        >
          <Edit2 size={12} />
          EDIT
        </button>
        <button
          aria-label={`Delete ${provider.name}`}
          onClick={() => onDelete(provider._id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer rounded-none"
        >
          <Trash2 size={12} />
          DELETE
        </button>
      </div>
    </div>
  );
}

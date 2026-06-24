'use client';

/**
 * @purpose Gestiona una lista de proveedores de autenticación federada y maneja la selección del usuario para la redirección.
 * @purpose_en Renders a list of federated authentication providers and handles user selection for redirection.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:yiwppe
 * @lastUpdated 2026-06-21T12:03:02.338Z
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, ExternalLink, Building2, Globe, CheckCircle, AlertCircle, Mail } from 'lucide-react';

interface Provider {
  _id: string;
  name: string;
  description: string;
  providerType: 'OIDC' | 'SAML';
  issuerUrl?: string;
  entityId?: string;
}

interface FederatedProviderListProps {
  providers: Provider[];
  prefillEmail?: string;
}

export function FederatedProviderList({ providers, prefillEmail }: FederatedProviderListProps) {
  const t = useTranslations('login.federated');
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoRedirected = useRef(false);

  // Auto-redirect if both provider and email are specified (deep link)
  useEffect(() => {
    if (autoRedirected.current) return;
    const params = new URLSearchParams(window.location.search);
    const providerParam = params.get('provider');
    const emailParam = params.get('email');
    if (providerParam && emailParam && providers.length > 0) {
      const matchedProvider = providers.find((p) => p._id === providerParam || p.name === providerParam);
      if (matchedProvider) {
        autoRedirected.current = true;
        handleSelectProvider(matchedProvider);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  const handleSelectProvider = async (provider: Provider) => {
    setLoadingProvider(provider._id);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('provider', provider._id);
      const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      params.set('redirect', redirectPath);

      if (provider.providerType === 'OIDC') {
        window.location.href = `/api/auth/federation/oidc/authorize?${params.toString()}`;
      } else if (provider.providerType === 'SAML') {
        const samlUrl = new URL('/api/auth/federation/saml/init', window.location.origin);
        samlUrl.searchParams.set('provider', provider._id);
        samlUrl.searchParams.set('redirect', redirectPath);
        window.location.href = samlUrl.toString();
      }
    } catch (err) {
      console.error('[FEDERATED_LOGIN] Provider selection failed:', err);
      setError(t('error_init'));
    } finally {
      setLoadingProvider(null);
    }
  };

  if (providers.length === 0) {
    return (
      <div className="bg-card/85 backdrop-blur-md border border-border rounded-none shadow-2xl p-8 text-center relative z-10">
        <div className="flex flex-col items-center gap-3 py-6">
          <AlertCircle size={24} className="text-muted-foreground/50" />
          <p className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest">
            {t('no_providers')}
          </p>
          <p className="text-[9px] font-mono text-muted-foreground/50">
            {t('contact_admin')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/85 backdrop-blur-md border border-border rounded-none shadow-2xl overflow-hidden relative z-10">
      {/* Email prefill banner */}
      {prefillEmail && (
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/15 rounded-none">
            <Mail size={14} className="text-primary shrink-0" />
            <div className="text-[10px] font-mono text-foreground">
              <span className="text-muted-foreground">{t('welcome_back')} </span>
              <span className="font-black text-primary">{prefillEmail}</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-3">
        <p className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
          {providers.length === 1
            ? t('providers_count', { count: 1 })
            : t('providers_count_plural', { count: providers.length })
          }
        </p>

        {error && (
          <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-none flex items-start gap-3 animate-in fade-in zoom-in duration-300">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono font-black text-red-500 leading-relaxed uppercase tracking-tight">{error}</p>
          </div>
        )}

        {providers.map((provider) => (
          <button
            key={provider._id}
            type="button"
            disabled={loadingProvider !== null}
            onClick={() => handleSelectProvider(provider)}
            className="w-full flex items-center gap-4 p-4 bg-secondary/20 border border-border hover:border-primary/40 hover:bg-secondary/30 hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.15)] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-none text-left group"
            aria-label={t('sign_in_with', { provider: provider.name })}
          >
            {/* Provider icon */}
            <div className="w-10 h-10 shrink-0 bg-primary/5 border border-primary/10 rounded-none flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              {provider.providerType === 'OIDC' ? (
                <Globe size={16} className="text-primary" />
              ) : (
                <Building2 size={16} className="text-primary" />
              )}
            </div>

            {/* Provider info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-foreground truncate">
                  {provider.name}
                </span>
                <span className={`text-[7px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded-none ${
                  provider.providerType === 'OIDC'
                    ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {provider.providerType}
                </span>
              </div>
              {provider.description && (
                <p className="text-[9px] font-mono text-muted-foreground/70 truncate mt-0.5">
                  {provider.description}
                </p>
              )}
              {provider.issuerUrl && (
                <p className="text-[8px] font-mono text-muted-foreground/40 truncate mt-0.5">
                  {provider.issuerUrl}
                </p>
              )}
            </div>

            {/* Action indicator */}
            {loadingProvider === provider._id ? (
              <Loader2 size={16} className="animate-spin text-primary shrink-0" />
            ) : (
              <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Footer badge */}
      <div className="p-4 bg-secondary/20 border-t border-border flex items-center justify-center gap-2">
        <CheckCircle size={10} className="text-emerald-500" />
        <span className="text-[8px] font-mono font-black text-muted-foreground uppercase tracking-[0.2em]">
          {t('footer_text')}
        </span>
      </div>
    </div>
  );
}

'use client';

/**
 * @purpose Renderiza una forma para crear o editar proveedores de identidad, incluyendo campos para el tipo de proveedor, nombre, descripción y otros detalles de configuración.
 * @purpose_en Renders a form for creating or editing identity providers, including fields for provider type, name, description, and other configuration details.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:exb3bu
 * @lastUpdated 2026-06-21T10:32:27.730Z
 */

import * as React from 'react';
import { X, Plus, Globe, Shield } from 'lucide-react';
import type { IdentityProviderDisplay, IdentityProviderFormValues, IdentityProviderTranslations } from './types';
import type { IdentityProvider } from '@/lib/schemas/identity-provider';

interface IdentityProviderFormProps {
  editingProvider: IdentityProviderDisplay | null;
  t: IdentityProviderTranslations;
  onSubmit: (data: IdentityProviderFormValues) => Promise<void>;
  onCancel: () => void;
}

export function IdentityProviderForm({ editingProvider, t, onSubmit, onCancel }: IdentityProviderFormProps) {
  const isEditing = !!editingProvider;
  const [providerType, setProviderType] = React.useState<'OIDC' | 'SAML'>(
    editingProvider?.providerType || 'OIDC'
  );
  const [form, setForm] = React.useState<IdentityProviderFormValues>({
    name: editingProvider?.name || '',
    description: editingProvider?.description || '',
    providerType: editingProvider?.providerType || 'OIDC',
    active: editingProvider?.active ?? true,
    issuerUrl: editingProvider?.issuerUrl || '',
    clientId: editingProvider?.clientId || '',
    clientSecret: editingProvider?.clientSecret && editingProvider.clientSecret !== '••••••••' ? editingProvider.clientSecret : '',
    entityId: editingProvider?.entityId || '',
    metadataUrl: editingProvider?.metadataUrl || '',
    attributeMapping: editingProvider?.attributeMapping || {
      sub: 'sub',
      email: 'email',
      name: 'name',
      surname: 'family_name',
    },
    allowedDomains: editingProvider?.allowedDomains || [],
    autoProvision: editingProvider?.autoProvision ?? false,
    defaultTenantId: editingProvider?.defaultTenantId || '',
  });
  const [newDomain, setNewDomain] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        providerType,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    if (domain && !form.allowedDomains.includes(domain)) {
      setForm({ ...form, allowedDomains: [...form.allowedDomains, domain] });
      setNewDomain('');
    }
  };

  const removeDomain = (index: number) => {
    setForm({
      ...form,
      allowedDomains: form.allowedDomains.filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provider Type Selector */}
      <div>
        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
          {t.form.provider_type}
        </label>
        <div className="flex gap-3">
          {(['OIDC', 'SAML'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setProviderType(type)}
              disabled={isEditing}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-widest border transition-all duration-200 rounded-none cursor-pointer ${
                providerType === type
                  ? type === 'OIDC'
                    ? 'border-sky-500/50 bg-sky-500/10 text-sky-400'
                    : 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : 'border-border/40 bg-transparent text-muted-foreground hover:border-border/60'
              } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {type === 'OIDC' ? <Globe size={14} /> : <Shield size={14} />}
              {type === 'OIDC' ? t.oidc_label : t.saml_label}
            </button>
          ))}
        </div>
      </div>

      {/* Name & Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.form.name}</label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder={t.form.placeholder_name}
            required
            className="w-full px-3 py-2 bg-background border border-border/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none transition-colors rounded-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.form.description}</label>
          <input
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder={t.form.placeholder_description}
            className="w-full px-3 py-2 bg-background border border-border/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none transition-colors rounded-none"
          />
        </div>
      </div>

      {/* OIDC Fields */}
      {providerType === 'OIDC' && (
        <div className="space-y-4 p-4 border border-sky-500/10 bg-sky-500/[0.02]">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-sky-400/60">OPENID CONNECT</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.form.issuer_url}</label>
              <input
                value={form.issuerUrl}
                onChange={e => setForm({ ...form, issuerUrl: e.target.value })}
                placeholder={t.form.placeholder_issuer}
                className="w-full px-3 py-2 bg-background border border-border/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none transition-colors rounded-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.form.client_id}</label>
              <input
                value={form.clientId}
                onChange={e => setForm({ ...form, clientId: e.target.value })}
                placeholder={t.form.placeholder_client_id}
                className="w-full px-3 py-2 bg-background border border-border/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none transition-colors rounded-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.form.client_secret}</label>
              <input
                type="password"
                value={form.clientSecret}
                onChange={e => setForm({ ...form, clientSecret: e.target.value })}
                placeholder={t.form.placeholder_client_secret}
                className="w-full px-3 py-2 bg-background border border-border/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none transition-colors rounded-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* SAML Fields */}
      {providerType === 'SAML' && (
        <div className="space-y-4 p-4 border border-amber-500/10 bg-amber-500/[0.02]">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-amber-400/60">SAML 2.0</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.form.entity_id}</label>
              <input
                value={form.entityId}
                onChange={e => setForm({ ...form, entityId: e.target.value })}
                placeholder={t.form.placeholder_entity_id}
                className="w-full px-3 py-2 bg-background border border-border/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none transition-colors rounded-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.form.metadata_url}</label>
              <input
                value={form.metadataUrl}
                onChange={e => setForm({ ...form, metadataUrl: e.target.value })}
                placeholder={t.form.placeholder_metadata_url}
                className="w-full px-3 py-2 bg-background border border-border/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none transition-colors rounded-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Attribute Mapping */}
      <div className="space-y-3 p-4 border border-border/20">
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{t.form.attribute_mapping}</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['sub', 'email', 'name', 'surname'] as const).map(field => (
            <div key={field} className="space-y-1">
              <label className="text-[8px] font-mono font-bold uppercase text-muted-foreground/80">{field}</label>
              <input
                value={form.attributeMapping[field]}
                onChange={e => setForm({
                  ...form,
                  attributeMapping: { ...form.attributeMapping, [field]: e.target.value },
                })}
                className="w-full px-2 py-1.5 bg-background border border-border/40 text-[10px] font-mono text-foreground focus:border-primary/40 focus:outline-none transition-colors rounded-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Allowed Domains */}
      <div className="space-y-2">
        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t.form.allowed_domains}</label>
        <div className="flex gap-2">
          <input
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())}
            placeholder={t.form.placeholder_domain}
            className="flex-1 px-3 py-2 bg-background border border-border/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none transition-colors rounded-none"
          />
          <button
            type="button"
            onClick={addDomain}
            className="px-3 py-2 border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer rounded-none"
          >
            <Plus size={14} />
          </button>
        </div>
        {form.allowedDomains.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.allowedDomains.map((domain, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-muted/30 border border-border/40 text-[10px] font-mono rounded-none">
                {domain}
                <button
                  type="button"
                  onClick={() => removeDomain(i)}
                  className="text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Auto-Provision */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.autoProvision}
            onChange={e => setForm({ ...form, autoProvision: e.target.checked })}
            className="w-3.5 h-3.5 border border-border/40 bg-background accent-primary"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.form.auto_provision}</span>
        </label>
      </div>

      {/* Active */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={e => setForm({ ...form, active: e.target.checked })}
            className="w-3.5 h-3.5 border border-border/40 bg-background accent-primary"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.form.active}</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-border/20">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors cursor-pointer rounded-none"
        >
          {t.form.cancel}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 cursor-pointer rounded-none"
        >
          {submitting ? '...' : t.form.save}
        </button>
      </div>
    </form>
  );
}

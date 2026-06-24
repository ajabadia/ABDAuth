'use client';

/**
 * @purpose Gestiona el display y la interacción de proveedores de identidad, incluyendo agregar, editar y eliminarlos.
 * @purpose_en Manages the display and interaction of identity providers, including adding, editing, and deleting them.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:10,sig:uxnh0m
 * @lastUpdated 2026-06-21T10:32:43.317Z
 */

import * as React from 'react';
import { Plus, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConfirmDialog, useConfirmDialog } from '@ajabadia/ecosystem-widgets';
import { IndustrialSearchInput } from '@ajabadia/ecosystem-widgets';
import { PageHeader } from '@/components/ui/industrial/PageHeader';
import { IdentityProviderCard } from './IdentityProviderCard';
import { IdentityProviderForm } from './IdentityProviderForm';
import type { IdentityProviderDisplay, IdentityProviderFormValues, IdentityProviderTranslations } from './types';

interface IdentityProviderManagementContainerProps {
  initialProviders: IdentityProviderDisplay[];
  t: IdentityProviderTranslations;
}

export function IdentityProviderManagementContainer({ initialProviders, t }: IdentityProviderManagementContainerProps) {
  const [providers, setProviders] = React.useState<IdentityProviderDisplay[]>(initialProviders);
  const [search, setSearch] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProvider, setEditingProvider] = React.useState<IdentityProviderDisplay | null>(null);
  const router = useRouter();

  const deleteDialog = useConfirmDialog<string>({
    onConfirm: async (id) => {
      try {
        const response = await fetch(`/api/admin/identity-providers/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          toast.success('Provider deleted successfully');
          router.refresh();
          setProviders(prev => prev.filter(p => p._id !== id));
        } else {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Error deleting provider');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error deleting provider';
        toast.error(msg);
      }
    },
  });

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.issuerUrl?.toLowerCase().includes(search.toLowerCase()) ||
    p.entityId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data: IdentityProviderFormValues) => {
    const isEditing = !!editingProvider;
    const url = isEditing
      ? `/api/admin/identity-providers/${editingProvider._id}`
      : '/api/admin/identity-providers';
    const method = isEditing ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      toast.success(isEditing ? 'Provider updated' : 'Provider created');
      router.refresh();
      const updatedResponse = await fetch('/api/admin/identity-providers');
      if (updatedResponse.ok) {
        const newData = await updatedResponse.json();
        setProviders(newData);
        setIsDialogOpen(false);
        setEditingProvider(null);
      }
    } else {
      const errData = await response.json().catch(() => ({}));
      toast.error(errData.error || 'Error saving provider');
    }
  };

  const handleEdit = (provider: IdentityProviderDisplay) => {
    setEditingProvider(provider);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteDialog.trigger(id);
  };

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={t.title}
        subtitle={`${t.subtitle} • ${providers.length} records`}
        breadcrumb={`CONTROL CONSOLE • FEDERATION`}
        icon={ShieldAlert}
        backHref="/dashboard"
        backAriaLabel="Back to dashboard"
        actionButton={
          <button
            aria-label={t.add_provider}
            onClick={() => { setEditingProvider(null); setIsDialogOpen(true); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98]"
          >
            <Plus size={14} />
            {t.add_provider}
          </button>
        }
      />

      <IndustrialSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search identity providers..."
        ariaLabel="Search identity providers"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProviders.map((provider) => (
          <IdentityProviderCard
            key={provider._id}
            provider={provider}
            t={t}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {providers.length === 0 && (
        <div className="p-20 text-center border border-dashed border-border rounded-none">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse font-bold">
            {t.no_providers}
          </p>
        </div>
      )}

      {/* Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4 border border-border/60 bg-card shadow-2xl rounded-none animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border/20">
              <h2 className="text-sm font-bold tracking-wider uppercase">
                {editingProvider ? t.edit_provider : t.new_provider}
              </h2>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <IdentityProviderForm
                editingProvider={editingProvider}
                t={t}
                onSubmit={handleSave}
                onCancel={() => { setIsDialogOpen(false); setEditingProvider(null); }}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="DELETE IDENTITY PROVIDER"
        message={t.delete_confirm}
        confirmLabel="DELETE"
        cancelLabel="CANCEL"
        variant="danger"
        isLoading={deleteDialog.isLoading}
        onConfirm={deleteDialog.confirm}
        onCancel={deleteDialog.cancel}
      />
    </div>
  );
}

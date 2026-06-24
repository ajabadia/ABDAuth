'use client';

/**
 * @purpose Gestiona y muestra la funcionalidad de gestión de usuarios dentro de la aplicación ABDAuth, incluyendo la recuperación de usuarios, el manejo de búsqueda, la edición y la adición de nuevos usuarios.
 * @purpose_en Manages and displays user management functionality within the ABDAuth application, including fetching users, handling search, editing, and adding new users.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:9,sig:t2tkf0
 * @lastUpdated 2026-06-21T12:03:31.445Z
 */

import { useState, useEffect } from "react";
import { Plus, Users } from "lucide-react";
import type { IndustrialUserDisplay, UserManagementTranslations, IndustrialUserFormValues } from "./types";
import { useRouter } from "next/navigation";
import { IndustrialSearchInput } from "@ajabadia/ecosystem-widgets";
import { PageHeader } from "@/components/ui/industrial/PageHeader";
import { toast } from "sonner";
import { UserGrid } from "./components/UserGrid";
import { UserFormModal } from "./components/UserFormModal";

interface UserManagementContainerProps {
  t: UserManagementTranslations;
  isSuperAdmin: boolean;
}

export function UserManagementContainer({ t, isSuperAdmin }: UserManagementContainerProps) {
  const [users, setUsers] = useState<IndustrialUserDisplay[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string; allowedApps?: string[] }[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IndustrialUserDisplay | null>(null);
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data as IndustrialUserDisplay[]);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants');
      const data = await response.json();
      if (Array.isArray(data)) {
        setTenants((data as { tenantId: string, name: string, allowedApps?: string[] }[]).map((tOrg) => ({ 
          id: tOrg.tenantId, 
          name: tOrg.name,
          allowedApps: tOrg.allowedApps || []
        })));
      } else {
        setTenants([]);
      }
    } catch {
      setTenants([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTenants();
  }, [isSuperAdmin]);

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (user.surname?.toLowerCase() || "").includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (data: IndustrialUserFormValues) => {
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser ? { ...data, _id: editingUser._id } : data;

      const response = await fetch('/api/admin/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setEditingUser(null);
        toast.success('SYSTEM_SYNC_COMPLETE', {
          description: t.messages.saveSuccess
        });
        router.refresh();
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error('SYSTEM_SYNC_FAILURE', {
          description: errorData.error || t.messages.saveError
        });
      }
    } catch (err: unknown) {
      toast.error('NETWORK_ORCHESTRATION_ERROR', {
        description: err instanceof Error ? err.message : 'Critical system failure'
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t.title}
        subtitle={`${t.subtitle} • ${users.length} records`}
        breadcrumb={`${t.controlConsole || "CONSOLA DE CONTROL"} • ${t.menuUsers || "IDENTITIES"}`}
        icon={Users}
        backHref="/dashboard"
        backAriaLabel={t.backToDashboard || "Back to dashboard"}
        actionButton={
          <button 
            aria-label={t.addUser}
            onClick={() => { setEditingUser(null); setIsDialogOpen(true); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98]"
          >
            <Plus size={14} />
            {t.addUser}
          </button>
        }
      />

      <IndustrialSearchInput 
        value={search} 
        onChange={setSearch} 
        placeholder="Search identity..." 
        ariaLabel="Search identity" 
      />

      <UserGrid 
        users={users}
        filteredUsers={filteredUsers}
        t={t}
        isSuperAdmin={isSuperAdmin}
        onEdit={(u) => { setEditingUser(u); setIsDialogOpen(true); }}
      />

      {/* Industrial Modal */}
      <UserFormModal 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingUser={editingUser}
        tenants={tenants}
        t={t}
        isSuperAdmin={isSuperAdmin}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

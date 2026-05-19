'use client';

import { useState, useEffect } from "react";
import { Plus, ArrowLeft, Users } from "lucide-react";
import type { IndustrialUserDisplay, UserManagementTranslations, IndustrialUserFormValues } from "./types";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { IndustrialSearchInput } from "@/components/ui/industrial/SearchInput";
import { toast } from "sonner";
import { UserGrid } from "./components/UserGrid";
import { UserFormModal } from "./components/UserFormModal";

interface UserManagementContainerProps {
  t: UserManagementTranslations;
  isSuperAdmin: boolean;
}

export function UserManagementContainer({ t, isSuperAdmin }: UserManagementContainerProps) {
  const [users, setUsers] = useState<IndustrialUserDisplay[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
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
    if (!isSuperAdmin) return;
    try {
      const response = await fetch('/api/admin/tenants');
      const data = await response.json();
      if (Array.isArray(data)) {
        setTenants((data as { tenantId: string, name: string }[]).map((tOrg) => ({ id: tOrg.tenantId, name: tOrg.name })));
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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
        <div className="flex flex-col gap-2">
          {/* Monospace Breadcrumb */}
          <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-2">
            <Users size={14} className="text-primary animate-pulse" aria-hidden="true" />
            {t.controlConsole || "CONSOLA DE CONTROL"} • {t.menuUsers || "IDENTITIES"}
          </div>
          
          {/* Fila de Título e Interacción */}
          <div className="flex items-center gap-4 mt-1">
            <Link
              href="/dashboard"
              aria-label={t.backToDashboard || "Back to dashboard"}
              className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <ArrowLeft size={14} />
            </Link>
            <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none flex-1 truncate">
              {t.title}
            </h1>
          </div>
          
          <p className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
            {t.subtitle} • <span className="text-primary font-bold">{users.length} records</span>
          </p>
        </div>
        
        <button 
          aria-label={t.addUser}
          onClick={() => { setEditingUser(null); setIsDialogOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98]"
        >
          <Plus size={14} />
          {t.addUser}
        </button>
      </header>

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

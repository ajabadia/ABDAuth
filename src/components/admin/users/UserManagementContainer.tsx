'use client';

import { useState, useEffect } from "react";
import { UserCard } from "./UserCard";
import { UserForm } from "./UserForm";
import { Plus } from "lucide-react";
import type { IndustrialUserDisplay, UserManagementTranslations, IndustrialUserFormValues } from "./types";
import { useRouter } from "next/navigation";

import { IndustrialModalHeader } from "@/components/ui/industrial/ModalHeader";
import { IndustrialSearchInput } from "@/components/ui/industrial/SearchInput";

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
      setUsers(data as IndustrialUserDisplay[]);
    } catch {
      // Silent catch
    }
  };

  const fetchTenants = async () => {
    if (!isSuperAdmin) return;
    try {
      const response = await fetch('/api/admin/tenants');
      const data = await response.json();
      setTenants((data as { tenantId: string, name: string }[]).map((tOrg) => ({ id: tOrg.tenantId, name: tOrg.name })));
    } catch {
      // Silent catch
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
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        router.refresh();
        fetchUsers();
      }
    } catch {
      // Silent catch
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{t.title}</h2>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] mt-1">
            {t.subtitle} • {users.length} records
          </p>
        </div>
        
        <button 
          aria-label={t.addUser}
          onClick={() => { setEditingUser(null); setIsDialogOpen(true); }}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-600/10"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredUsers.map((user) => (
          <UserCard 
            key={user._id} 
            user={user} 
            t={t} 
            isSuperAdmin={isSuperAdmin} 
            onEdit={(u) => { setEditingUser(u); setIsDialogOpen(true); }} 
          />
        ))}
      </div>

      {users.length === 0 && (
        <div className="p-20 text-center border border-dashed border-border rounded-xl">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse font-bold">
            No system identities detected in sector
          </p>
        </div>
      )}

      {/* Industrial Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsDialogOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <IndustrialModalHeader 
              title={editingUser ? t.editUser : t.addUser} 
              subtitle="USER ORCHESTRATOR V1.1" 
              icon={Plus} 
              onClose={() => setIsDialogOpen(false)} 
            />
            <div className="p-0">
              <UserForm 
                initialData={editingUser || undefined}
                tenants={tenants}
                t={t}
                isSuperAdmin={isSuperAdmin}
                onSubmit={handleSubmit}
                onCancel={() => setIsDialogOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

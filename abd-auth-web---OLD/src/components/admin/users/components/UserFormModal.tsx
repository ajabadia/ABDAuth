import React from "react";
import { Plus } from "lucide-react";
import { IndustrialModalHeader } from "@/components/ui/industrial/ModalHeader";
import { UserForm } from "../UserForm";
import type { IndustrialUserDisplay, UserManagementTranslations, IndustrialUserFormValues } from "../types";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: IndustrialUserDisplay | null;
  tenants: { id: string; name: string; allowedApps?: string[] }[];
  t: UserManagementTranslations;
  isSuperAdmin: boolean;
  onSubmit: React.ComponentProps<typeof UserForm>['onSubmit'];
}

export function UserFormModal({
  isOpen,
  onClose,
  editingUser,
  tenants,
  t,
  isSuperAdmin,
  onSubmit
}: UserFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-sm shadow-xl overflow-y-auto max-h-[95vh] md:max-h-[90vh] animate-in zoom-in-95 duration-200">
        <IndustrialModalHeader 
          title={editingUser ? t.editUser : t.addUser} 
          subtitle="USER ORCHESTRATOR V1.1" 
          icon={Plus} 
          onClose={onClose} 
        />
        <div className="p-0">
          <UserForm 
            initialData={editingUser || undefined}
            tenants={tenants}
            t={t}
            isSuperAdmin={isSuperAdmin}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

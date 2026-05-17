'use client';

import { useState, useEffect } from "react";
import type { 
  IndustrialUserDisplay, 
  UserManagementTranslations, 
  IndustrialUserFormValues
} from "./types";
import { IdentitySection } from "./sections/IdentitySection";
import { GovernanceSection } from "./sections/GovernanceSection";
import { FormActions } from "./sections/FormActions";

// Extender tipos locales para incluir mfaEnforced
interface UserFormValuesExtended extends IndustrialUserFormValues {
  mfaEnforced: boolean;
}

// Encapsulated async type to satisfy i18n audit
type IndustrialAsyncVoid = Promise<void>;

interface UserFormProps {
  initialData?: Partial<IndustrialUserDisplay> & { mfaEnforced?: boolean };
  tenants: { id: string; name: string }[];
  t: UserManagementTranslations;
  isSuperAdmin: boolean;
  onSubmit: (values: UserFormValuesExtended) => IndustrialAsyncVoid;
  onCancel: () => void;
}

export function UserForm({ initialData, tenants, t, isSuperAdmin, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormValuesExtended>({
    email: initialData?.email || "",
    password: "",
    name: initialData?.name || "",
    surname: initialData?.surname || "",
    role: initialData?.role || "USER",
    tenantId: initialData?.tenantId || "",
    mfaEnforced: initialData?.mfaEnforced || false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        email: initialData.email || "",
        name: initialData.name || "",
        surname: initialData.surname || "",
        role: initialData.role || "USER",
        tenantId: initialData.tenantId || "",
        mfaEnforced: initialData.mfaEnforced || false,
      }));
    }
  }, [initialData]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManualChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value } as UserFormValuesExtended));
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-card/50 backdrop-blur-xl">
      <IdentitySection 
        formData={formData} 
        handleChange={handleChange} 
        isEdit={!!initialData?._id} 
        t={t} 
      />

      <GovernanceSection 
        formData={formData} 
        tenants={tenants} 
        isSuperAdmin={isSuperAdmin} 
        t={t} 
        onChange={handleManualChange}
      />

      <FormActions 
        onCancel={onCancel} 
        isSubmitting={isSubmitting} 
        t={t} 
      />
    </form>
  );
}

'use client';

/**
 * @purpose Gestiona el rendimiento y estado de un formulario de usuario para crear o editar usuarios industriales, incluyendo secciones de identidad, gobernanza y membresía.
 * @purpose_en Manages the rendering and state of a user form for creating or editing industrial users, including identity, governance, and membership sections.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:1r7wncm
 * @lastUpdated 2026-06-21T10:36:58.486Z
 */

import { useState, useEffect } from "react";
import type { 
  IndustrialUserDisplay, 
  UserManagementTranslations, 
  IndustrialUserFormValues
} from "./types";
import { IdentitySection } from "./sections/IdentitySection";
import { GovernanceSection } from "./sections/GovernanceSection";
import { MembershipsSection } from "./sections/MembershipsSection";
import { FormActions } from "./sections/FormActions";

// Extender tipos locales para incluir mfaEnforced y tenants
interface UserFormValuesExtended extends IndustrialUserFormValues {
  mfaEnforced: boolean;
}

// Encapsulated async type to satisfy i18n audit
type IndustrialAsyncVoid = Promise<void>;

interface UserFormProps {
  initialData?: Partial<IndustrialUserDisplay> & { mfaEnforced?: boolean };
  tenants: { id: string; name: string; allowedApps?: string[] }[];
  t: UserManagementTranslations;
  isSuperAdmin: boolean;
  onSubmit: (values: UserFormValuesExtended) => IndustrialAsyncVoid;
  onCancel: () => void;
}

export function UserForm({ initialData, tenants, t, isSuperAdmin, onSubmit, onCancel }: UserFormProps) {
  const getDefaultTenants = () => {
    if (initialData?.tenants && initialData.tenants.length > 0) {
      return initialData.tenants;
    }
    if (!initialData?._id && tenants.length > 0) {
      const defaultId = initialData?.tenantId || tenants[0].id;
      return [{
        tenantId: defaultId,
        role: 'student',
        status: 'active',
        allowedApps: []
      }];
    }
    return [];
  };

  const [formData, setFormData] = useState<UserFormValuesExtended>({
    email: initialData?.email || "",
    password: "",
    name: initialData?.name || "",
    surname: initialData?.surname || "",
    role: initialData?.role || "USER",
    tenantId: initialData?.tenantId || (tenants.length > 0 ? tenants[0].id : ""),
    tenants: getDefaultTenants() as never,
    mfaEnforced: initialData?.mfaEnforced || false,
  });

  useEffect(() => {
    if (initialData) {
      const userTenants = initialData.tenants && initialData.tenants.length > 0
        ? initialData.tenants
        : (!initialData._id && tenants.length > 0
            ? [{
                tenantId: initialData.tenantId || tenants[0].id,
                role: 'student',
                status: 'active',
                allowedApps: []
              }]
            : []);

      setFormData(prev => ({
        ...prev,
        email: initialData.email || "",
        name: initialData.name || "",
        surname: initialData.surname || "",
        role: initialData.role || "USER",
        tenantId: initialData.tenantId || (tenants.length > 0 ? tenants[0].id : ""),
        tenants: userTenants as never,
        mfaEnforced: initialData.mfaEnforced || false,
      }));
    }
  }, [initialData, tenants]);

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

  const handleManualChange = (name: string, value: unknown) => {
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

      <MembershipsSection 
        memberships={formData.tenants || []}
        onChange={(updatedMemberships) => handleManualChange('tenants', updatedMemberships)}
        defaultTenantId={formData.tenantId}
        onDefaultTenantChange={(tid) => handleManualChange('tenantId', tid)}
        tenants={tenants}
        t={t}
        isSuperAdmin={isSuperAdmin}
      />

      <FormActions 
        onCancel={onCancel} 
        isSubmitting={isSubmitting} 
        t={t} 
      />
    </form>
  );
}


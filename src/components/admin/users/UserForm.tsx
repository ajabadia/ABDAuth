'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { 
  IndustrialUserDisplay, 
  UserManagementTranslations, 
  IndustrialUserFormValues,
  UserSubmitHandler
} from "./types";

interface UserFormProps {
  initialData?: Partial<IndustrialUserDisplay>;
  tenants: { id: string; name: string }[];
  t: UserManagementTranslations;
  isSuperAdmin: boolean;
  onSubmit: UserSubmitHandler;
  onCancel: () => void;
}

export function UserForm({ initialData, tenants, t, isSuperAdmin, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<IndustrialUserFormValues>({
    email: initialData?.email || "",
    password: "",
    name: initialData?.name || "",
    surname: initialData?.surname || "",
    role: initialData?.role || "USER",
    tenantId: initialData?.tenantId || "",
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t.form.name}</Label>
          <Input 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
            className="ind-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="surname">{t.form.surname}</Label>
          <Input 
            id="surname" 
            name="surname" 
            value={formData.surname} 
            onChange={handleChange} 
            required 
            className="ind-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t.form.email}</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
          className="ind-input"
        />
      </div>

      {!initialData?._id && (
        <div className="space-y-2">
          <Label htmlFor="password">{t.form.password}</Label>
          <Input 
            id="password" 
            name="password" 
            type="password" 
            value={formData.password} 
            onChange={handleChange} 
            required 
            className="ind-input"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">{t.form.role}</Label>
          <select 
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="ind-select"
          >
            {Object.entries(t.roles).map(([key, label]) => (
              (isSuperAdmin || key !== 'SUPER_ADMIN') && (
                <option key={key} value={key} className="bg-neutral-900">{label}</option>
              )
            ))}
          </select>
        </div>

        {isSuperAdmin && (
          <div className="space-y-2">
            <Label htmlFor="tenantId">{t.form.tenant}</Label>
            <select 
              id="tenantId"
              name="tenantId"
              value={formData.tenantId}
              onChange={handleChange}
              className="ind-select"
              required
            >
              <option value="" disabled className="bg-neutral-900">{t.form.tenant}</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id} className="bg-neutral-900">{tenant.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t ind-border">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          {t.form.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "..." : t.form.save}
        </Button>
      </div>
    </form>
  );
}

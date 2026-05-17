'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock } from "lucide-react";
import type { UserManagementTranslations, IndustrialUserFormValues } from "../types";

interface IdentitySectionProps {
  formData: IndustrialUserFormValues;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEdit: boolean;
  t: UserManagementTranslations;
}

export function IdentitySection({ formData, handleChange, isEdit, t }: IdentitySectionProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">{t.form.core_identity}</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2.5">
          <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
            {t.form.name}
          </Label>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={14} />
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="pl-10 h-11 bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/10 transition-all rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="surname" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
            {t.form.surname}
          </Label>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={14} />
            <Input 
              id="surname" 
              name="surname" 
              value={formData.surname} 
              onChange={handleChange} 
              required 
              className="pl-10 h-11 bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/10 transition-all rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
          {t.form.email}
        </Label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={14} />
          <Input 
            id="email" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            required 
            className="pl-10 h-11 bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/10 transition-all rounded-lg text-sm"
          />
        </div>
      </div>

      {!isEdit && (
        <div className="space-y-2.5">
          <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
            {t.form.password}
          </Label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={14} />
            <Input 
              id="password" 
              name="password" 
              type="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              className="pl-10 h-11 bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/10 transition-all rounded-lg text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @purpose Renderiza una red de tarjetas de usuario según los usuarios filtrados.
 * @purpose_en Renders a grid of user cards based on filtered users.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:qd9efs
 * @lastUpdated 2026-06-21T12:03:24.782Z
 */

import React from "react";
import { UserCard } from "../UserCard";
import type { IndustrialUserDisplay, UserManagementTranslations } from "../types";

interface UserGridProps {
  users: IndustrialUserDisplay[];
  filteredUsers: IndustrialUserDisplay[];
  t: UserManagementTranslations;
  isSuperAdmin: boolean;
  onEdit: (user: IndustrialUserDisplay) => void;
}

export function UserGrid({
  users,
  filteredUsers,
  t,
  isSuperAdmin,
  onEdit
}: UserGridProps) {
  if (users.length === 0) {
    return (
      <div className="p-20 text-center border border-dashed border-border rounded-sm">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse font-bold">
          No system identities detected in sector
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {filteredUsers.map((user) => (
        <UserCard 
          key={user._id} 
          user={user} 
          t={t} 
          isSuperAdmin={isSuperAdmin} 
          onEdit={onEdit} 
        />
      ))}
    </div>
  );
}

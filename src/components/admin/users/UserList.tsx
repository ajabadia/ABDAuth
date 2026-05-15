'use client';

import { UserCard } from "./UserCard";
import type { IndustrialUserDisplay, UserManagementTranslations } from "./types";

interface UserListProps {
  users: IndustrialUserDisplay[];
  t: UserManagementTranslations;
  isSuperAdmin: boolean;
  onEdit: (user: IndustrialUserDisplay) => void;
}

/**
 * 👥 Industrial User List (Grid Layout)
 * Follows the visual pattern established in Tenant management.
 */
export function UserList({ users, t, isSuperAdmin, onEdit }: UserListProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <UserCard 
            key={user._id} 
            user={user} 
            t={t} 
            isSuperAdmin={isSuperAdmin} 
            onEdit={onEdit} 
          />
        ))}
      </div>

      {users.length === 0 && (
        <div className="ind-border ind-bg p-20 text-center rounded-xl">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse font-black">
            No system identities detected in sector
          </p>
        </div>
      )}
    </div>
  );
}

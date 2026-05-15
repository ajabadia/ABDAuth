import { IndustrialSession } from "../src/types/auth";

/**
 * 🛡️ Security Filter Orchestrator
 * Implements the explicit SuperAdmin bypass logic.
 */
function getSecurityFilter(session: IndustrialSession, baseFilter: any = {}) {
  // Diplomatic Pass for SuperAdmin
  if (session.role === 'SUPER_ADMIN') {
    console.log(`[AUTH] SUPER_ADMIN Access Granted - Global View Enabled.`);
    return baseFilter;
  }

  // Industrial Isolation for all other roles
  console.log(`[AUTH] Enforcing Tenant Isolation for ID: ${session.tenantId}`);
  return {
    ...baseFilter,
    tenantId: session.tenantId
  };
}

// --- TEST CASES ---

const mockSuperAdmin: any = {
  role: 'SUPER_ADMIN',
  tenantId: 'SYSTEM'
};

const mockUser: any = {
  role: 'ADMIN',
  tenantId: 'TENANT_A'
};

const userSearch = { active: true };

console.log("--- TEST 1: SuperAdmin Search ---");
console.log("Filter Result:", getSecurityFilter(mockSuperAdmin, userSearch));

console.log("\n--- TEST 2: Regular Admin Search ---");
console.log("Filter Result:", getSecurityFilter(mockUser, userSearch));

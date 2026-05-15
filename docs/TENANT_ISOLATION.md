# 🏢 Tenant Isolation & Multi-Tenancy Standard (Era 11)

## 🛡️ Objective
Ensure deterministic data isolation across the ABD Industrial Stack (ABDAgRAG, ABDQuiz, etc.) by utilizing claims emitted by the **ABDAuth** central identity provider.

## 🔑 Session Claims
Every authenticated session in the ABD ecosystem MUST carry the following metadata:
- `tenantId`: Unique identifier of the organization.
- `dbPrefix`: Short prefix (e.g., `ag_`, `qz_`, `demo_`) used to isolate database resources.
- `isolationStrategy`: 
    - `COLLECTION_PREFIX`: All data resides in the same DB, but collections are prefixed (e.g., `ag_users`).
    - `DATABASE_PER_TENANT`: Every tenant has a dedicated physical database.

## 🚀 Implementation Logic (Satellites)

### 1. Interception
Satellite projects MUST intercept the ABDAuth JWT/Session and extract the `dbPrefix`.

### 2. Repository Pattern (Example)
Repositories in AgRAG or Quiz MUST be "tenant-aware":

```typescript
// src/lib/db.ts in ABDAgRAG
export const getCollection = async (session: IndustrialSession, collectionName: string) => {
  const db = await getDb();
  const prefix = session.dbPrefix;
  return db.collection(`${prefix}${collectionName}`);
};
```

### 3. Global Filter
If the strategy is `COLLECTION_PREFIX`, every query MUST include the `tenantId` as a secondary safety gate:
```typescript
db.collection('users').find({ tenantId: session.tenantId, ...query });
```

## 🔐 Security Governance
1. **Inmutability**: Once a session is established, the `tenantId` and `dbPrefix` MUST NOT be changed by the client.
2. **SuperAdmin Bypass**: Only users with the `SUPER_ADMIN` role can access data across multiple `tenantId` contexts (for global auditing).
3. **Cross-Tenant Prevention**: Any request that fails the tenant verification MUST result in an immediate `403 Forbidden` and be logged as a security breach in `AuditRepository`.

---
**Standard**: `ABD-ISO-MT-11` | **Status**: `CERTIFIED`

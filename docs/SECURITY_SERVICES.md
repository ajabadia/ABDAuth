# 🛡️ Security Services Specification

This document defines the core security services of the ABDAuth ecosystem and their integration with the Telemetry/Logs cluster.

## 🗝️ SessionService

The `SessionService` manages the lifecycle of industrial sessions, ensuring full visibility and control over active connections.

### Key Features
- **Persistence**: Sessions are stored in the `ABDElevators-Logs` cluster (`sessions` collection).
- **Device Intelligence**: Automatic User-Agent parsing for browser, OS, and device type detection.
- **Remote Revocation**: Capability to terminate specific or all sessions for a user (e.g., during password changes or security breaches).
- **Auto-Cleanup**: Sessions are automatically revoked upon explicit logout.

### Data Schema (LOGS Cluster)
```typescript
{
  userId: string;
  email: string;
  tenantId: string;
  ip?: string;
  userAgent?: string;
  device: { browser, os, type };
  lastActive: Date;
  expiresAt: Date;
}
```

---

## 🔒 MfaService

The `MfaService` implements industrial-grade Multi-Factor Authentication using the TOTP standard.

### Key Features
- **TOTP (RFC 6238)**: Compatible with Google Authenticator, Authy, and Microsoft Authenticator.
- **Recovery Codes**: Generation of 8 one-time backup codes (hashed via bcrypt) for account recovery.
- **Fail-Closed Strategy**: Authentication is rejected if a user has MFA enabled but no configuration is found.
- **Integrated Audit**: Every MFA operation is logged to the `access_logs` collection.

### Workflows
1. **Setup**: Generates secret and QR code URI.
2. **Enable**: Verifies first token and generates/stores hashed backup codes.
3. **Verify**: Standard verification during login flow.
4. **Disable**: Atomic removal of MFA config and user flag update.

---

## 🛰️ Telemetry Integration

All security events are routed to the **LOGS** cluster to maintain the **AUTH** cluster clean and focused on identity.

- **Access Logs**: Stored in `access_logs`.
- **Sessions**: Stored in `sessions`.

---
*Created: 05/15/2026*

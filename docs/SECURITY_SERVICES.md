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

### 🔑 Biometric WebAuthn (Passkeys)
- **Passwordless Flow**: Users can register passkeys (TouchID, FaceID, Windows Hello) using the FIDO2 standard.
- **Verification Engine**: Handles registration and authentication ceremonies powered by `@simplewebauthn/server` and `@simplewebauthn/browser`.
- **Transient Challenge Cache**: WebAuthn challenges are temporarily stored in `webauthn_challenges` with a 5-minute MongoDB TTL index to prevent state discrepancies in serverless hosts.
- **Biometric Bypass Token**: Successful passkey authentication issues a transient 30-second single-use JWT signed with `AUTH_JWT_SECRET` to securely bypass credentials verification.

### ⏳ MFA Grace Period (Onboarding Bypass)
- **Permissive Flow**: When `mfaEnforced` is active but `mfaEnabled` is false, the user enters a grace period countdown rather than immediate lockouts.
- **Thresholds**: Defaults to a countdown of **3 logins** or a deadline of **7 days** since enforcement started.
- **Automatic Enforcement**: The grace period status is checked dynamically during every session validation. Once expired or the login counter hits zero, the user is strictly redirected to `/login/mfa/setup`.
- **Audit Logging**: Grace bypass events are audited under the `MFA_GRACE_BYPASS` event.

---

## 🛰️ Telemetry Integration

All security events are routed to the **LOGS** cluster to maintain the **AUTH** cluster clean and focused on identity.

- **Access Logs**: Stored in `access_logs`.
- **Sessions**: Stored in `sessions`.

---
*Created: 05/15/2026*

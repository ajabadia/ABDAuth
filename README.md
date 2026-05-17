# 🛡️ ABDAuth Identity Ecosystem

**Centralized IAM for the ABD Industrial Ecosystem.**
![Status](https://img.shields.io/badge/Status-SYS__CERTIFIED__PROD-0070f3?style=for-the-badge)
![Deployment](https://img.shields.io/badge/Deployment-STABLE-success?style=for-the-badge)

ABDAuth is the certified identity provider (IdP) designed to manage authentication, authorization, and multi-tenant isolation across all satellite projects (ABDAgRAG, ABDQuiz, etc.) through secure OAuth2 federation.

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env.local` file with your MongoDB and Security secrets (see `.env.example`).

3. **Database Seeding**:
   Initialize the system with the first Super Admin:
   ```bash
   npx tsx --env-file=.env.local src/scripts/seed-admin.ts
   ```

4. **Run Development Server**:
   ```bash
   .\start.bat
   ```
   The portal will be available at `http://localhost:3400`.

## 🏗️ Architecture

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Auth**: Auth.js v5 (Beta)
- **Database**: Multi-Cluster MongoDB (Auth, Data, and Telemetry/Logs clusters)
- **Styling**: Tailwind CSS v4 + Uncodixfy UI Standard
- **i18n**: next-intl (Locale-prefixed routing with industrial switcher)
- **UI Architecture**: Premium Cyber-Industrial Entry Portal + Aseptic Dashboard.

- **MFA Hardening**: Industrial TOTP implementation with functional API (otplib v13), alphanumeric recovery codes, and session rescue protocols.
- **Audit Compliance**: Verified via `abd-audit.ps1` (6-phase certification pipeline).
- **Self-Service Governance**: Industrialized password management and security telemetry visualization.
- **Proactive Governance**: Integrated security recommendation system for non-mandatory users.

## 🗓️ 2026-05-15 (Bloque A, B & C: Phase 4 Industrialization)
- **Identity Recovery Ecosystem**: Deployed full "Forgot Password" flow featuring Resend integration, secure token orchestration, and industrial recovery UI.
- **Email Verification / Activation**: Deployed industrial onboarding flow with 7-day invitation links and mandatory account activation.
- **Account Lockout (Brute-force Protection)**: Implemented progressive lockout mechanism (15 min after 5 failures) within the authentication engine.
- **Rate Limiting Infrastructure**: Deployed persistent IP-based throttling for critical identity endpoints (Login: 10/min, Recovery: 3/hour).
- **Security Notification Hub**: Integrated automated email alerts for critical events (password change, MFA reset, account activation).
- **Global Revocation Sync**: Implemented real-time session invalidation across the suite upon credential updates or recovery events.
- **Security Portal Layout Refactor**: Optimized `/dashboard/security` grid to balance MFA and Password governance modules.
- **Audit Schema Expansion**: Added `PASSWORD_CHANGE` and `LOGIN_FAILURE` (Lockout) events for strict type-safe activity logging.
- **Singleton Database Pool**: Transitioned to a unified MongoDB connection singleton to resolve `SSL alert 80` errors on Windows.

## 🔐 Security Standards

- **JWT Claims**: `sub`, `email`, `role`, `tenantId`, `mfa_verified`.
- **Encryption**: AES-256-GCM for sensitive data.
- **Persistence**: Unified singleton connection pool for high-availability cloud access.
- **Audit**: Verified via `abd-audit.ps1` (6-phase compliance).

## 📖 Documentation

- [**Identity Platform Model**](./docs/IDENTITY_PLATFORM_MODEL.md): Theoretical model, best practices, and industrial roadmap.
- [**Industrial UI Specification**](./docs/INDUSTRIAL_UI.md): Theme standards and unified settings control.
- [**Security Services**](./docs/SECURITY_SERVICES.md): Session management and MFA specifications.
- [**Federated Handshake**](./docs/FEDERATED_HANDSHAKE.md): Token exchange and satellite integration.
- [**Technical Architecture**](./docs/ARCHITECTURE.md): Core design and component standards.
- [**API Reference**](./docs/API_REFERENCE.md): SSO Federation and Governance endpoints.
- [**Lessons Learned**](./docs/LESSONS_LEARNED.md): Industrial audit remediation log.

---
© 2026 ABD Industrial Ecosystem

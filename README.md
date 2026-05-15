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
- **Database**: MongoDB
- **Styling**: Tailwind CSS v4 + Uncodixfy UI Standard
- **i18n**: next-intl (Locale-prefixed routing with industrial switcher)
- **UI Architecture**: Premium Cyber-Industrial Entry Portal + Aseptic Dashboard.

## 🔐 Security Standards

- **JWT Claims**: `sub`, `email`, `role`, `tenantId`, `mfa_verified`.
- **Encryption**: AES-256-GCM for sensitive data.
- **Audit**: Verified via `abd-audit.ps1` (6-phase compliance).

## 📖 Documentation

- [**Industrial UI Specification**](./docs/INDUSTRIAL_UI.md): Theme standards and unified settings control.
- [**Federated Handshake**](./docs/FEDERATED_HANDSHAKE.md): Token exchange and satellite integration.
- [**Technical Architecture**](./docs/ARCHITECTURE.md): Core design and component standards.
- [**API Reference**](./docs/API_REFERENCE.md): SSO Federation and Governance endpoints.
- [**Lessons Learned**](./docs/LESSONS_LEARNED.md): Industrial audit remediation log.

---
© 2026 ABD Industrial Ecosystem

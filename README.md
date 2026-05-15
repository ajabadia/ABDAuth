# 🛡️ ABDAuth Identity Ecosystem

**Centralized IAM for the ABD Industrial Ecosystem.**

ABDAuth is the certified identity provider (IdP) designed to manage authentication, authorization, and multi-tenant isolation across all projects (ABDAgRAG, ABDQuiz, etc.).

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
- **i18n**: next-intl (Cookie-based, no prefixes)

## 🔐 Security Standards

- **JWT Claims**: `sub`, `email`, `role`, `tenantId`, `mfa_verified`.
- **Encryption**: AES-256-GCM for sensitive data.
- **Route Protection**: Centralized `proxy.ts` guard.

---
© 2026 ABD Industrial Ecosystem

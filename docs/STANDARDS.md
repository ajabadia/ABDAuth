# 🛡️ ABDAuth Industrial Standards

This document defines the normative standards for data modeling, naming conventions, and architectural purity within the ABDAuth ecosystem.

## 🧬 1. Data Modeling & Naming (English Canonical)
All database entities and code interfaces must use **Pure English Canonical Metadata**. Redundant or non-English fields are strictly prohibited.

### 👤 User Entity Standard
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Canonical first name. |
| `surname` | `string` | Canonical last name(s). |
| `email` | `string` | Primary identifier (lowercase). |
| `telephone` | `string` | International format phone number. |
| `role` | `enum` | One of: SUPER_ADMIN, ADMIN, USER, AUDITOR, OPERATOR. |
| `active` | `boolean` | Primary status flag. |
| `createdAt` | `Date` | Immutable creation timestamp. |

### 🏢 Tenant Entity Standard
| Field | Type | Description |
| :--- | :--- | :--- |
| `tenantId` | `string` | Unique URL-safe identifier (slug). |
| `name` | `string` | Legal or display name. |
| `active` | `boolean` | Status flag. |
| `createdAt` | `Date` | Creation timestamp. |

## 🏗️ 2. Repository & Normalization Layer
Direct access to raw database documents is discouraged. All data fetching must pass through the **Industrial Normalization Layer**.

- **Normalizer**: `src/lib/utils/IndustrialNormalizer.ts`
- **Goal**: Ensure that even if legacy data is ingested, the application always operates on the Canonical Model.

## 🌍 3. Internationalization (i18n)
- **Primary Locales**: `en` (English), `es` (Spanish).
- **Structure**: Dictionaries must be synchronized. If a key is added to `en.json`, it must be present in `es.json`.
- **Formatting**: Dates and numbers must be localized using the `next-intl` utilities.

## 🔒 4. Security Standards
- **MFA**: Mandatory for all administrative roles.
- **Encryption**: Sensitive fields (like custom keys or secrets) must be encrypted using `SecurityService` (AES-256-GCM).
- **Audit**: Every identity change must be logged in the `audit_logs` collection.

## 🛠️ 5. Zero-Noise Policy
- **TSC**: 0 errors allowed.
- **Purity**: No `any` types. Use `unknown` or explicit interfaces.
- **A11y**: Full ARIA compliance for all interactive elements.

---
*Certified by ABD Industrial Audit v1.0 - 2026*

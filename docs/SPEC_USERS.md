# 📘 SPEC: Hierarchical User Governance (Phase 7.2)
**Certified Industrial Identity Management**

## 🎯 Objective
Implementar un sistema de gestión de usuarios que permita la administración centralizada (SuperAdmin) y la administración delegada (TenantAdmin), garantizando el aislamiento estricto de datos entre organizaciones.

---

## 🏗️ 1. Modelo de Datos (Extensión de `IndustrialUser`)
Los usuarios se almacenan en la colección centralizada, pero su visibilidad está determinada por su `tenantId`.

| Campo | Tipo | Visibilidad SuperAdmin | Visibilidad TenantAdmin |
| :--- | :--- | :--- | :--- |
| `email` | String | Read/Write | Read/Write |
| `role` | Enum | All Roles | Limited to ADMIN/USER |
| `tenantId` | String | Seleccionable | Bloqueado al propio |
| `tenantAccess` | Array<Membership> | Read/Write (Global) | Read Only (Self Tenant) |
| `status` | Enum | Active/Suspended | Active/Suspended |
| `mfaEnabled`| Boolean| Read/Write | Read Only |
| `preferences`| Object | Read Only | Read Only |

---

## 🔒 2. Seguridad de API (Enforcement)

### Reglas de Acceso (RBAC + Tenant Isolation)
1.  **`GET /api/admin/users`**:
    *   `SUPER_ADMIN`: Devuelve todos los usuarios.
    *   `ADMIN`: Devuelve solo usuarios donde `tenantId === session.user.tenantId`.
2.  **`POST /api/admin/users`**:
    *   `ADMIN`: Forzar `payload.tenantId = session.user.tenantId` antes de persistir.
    *   Prohibir la creación de roles `SUPER_ADMIN` desde este rol.

---

## 🎨 3. Interfaz de Usuario (Industrial Aseptic)

### Componente: `UserManagementOrchestrator`
-   **Vista SuperAdmin**: Incluye un `TenantSwitcher` en la cabecera de la tabla para filtrar por organización.
-   **Vista TenantAdmin**: La columna "Tenant" desaparece o se muestra como etiqueta fija.

### Acciones Críticas:
-   **Reset Password**: Generación de credenciales temporales.
-   **Impersonation (SuperAdmin only)**: Capacidad de ver el dashboard como un usuario específico para soporte técnico.

---

## 📅 4. Hitos de Implementación
1.  [ ] **Backend**: Refactor de `UserSchema` y creación de rutas protegidas.
2.  [ ] **UI Logic**: Adaptación de formularios según el rol de la sesión.
3.  [ ] **Audit**: Registro de qué administrador creó/modificó a qué usuario.

---
**Status**: `SPEC_DRAFT` | **Approver**: Antigravity Board

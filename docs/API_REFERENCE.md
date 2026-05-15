# 📖 API Reference - ABDAuth Industrial IdP
**Certified Era 11 Integration Guide**

Este documento detalla los endpoints disponibles en el ecosistema de ABDAuth para la gestión de identidad y la federación de satélites.

---

## 🛰️ 1. Identity Bridge (SSO Federation)

### `GET /api/auth/session`
Endpoint crítico utilizado por los satélites (ABDQuiz, ABDAgRAG) para verificar la identidad federada.

-   **Auth**: Requiere cookies de sesión válidas (`authjs.session-token`).
-   **Response (200 OK)**:
    ```json
    {
      "authenticated": true,
      "user": {
        "id": "string",
        "email": "string",
        "role": "SUPER_ADMIN | ADMIN | USER",
        "tenantId": "string"
      },
      "expires": "ISO-8601-Timestamp"
    }
    ```
-   **Response (401 Unauthorized)**:
    ```json
    { "authenticated": false }
    ```

---

## 🏢 2. Tenant Governance (Admin Only)
*Todos estos endpoints requieren el rol `SUPER_ADMIN`.*

### `GET /api/admin/tenants`
Lista todas las organizaciones registradas en el sistema.

-   **Response (200 OK)**:
    ```json
    [
      {
        "_id": "string",
        "name": "string",
        "tenantId": "string",
        "industry": "industrial | energy | logistics | security",
        "active": true,
        "dbPrefix": "string"
      }
    ]
    ```

### `POST /api/admin/tenants`
Registra una nueva organización en el ecosistema.

-   **Payload**:
    ```json
    {
      "name": "string",
      "tenantId": "string",
      "industry": "string",
      "dbPrefix": "string"
    }
    ```
-   **Validation**: Basada en `TenantSchema`. El `tenantId` debe ser único.

### `PATCH /api/admin/tenants/[id]`
Actualiza los metadatos de una organización existente.

-   **Path Parameter**: `id` (MongoDB ObjectId).
-   **Payload**: Parcial del objeto Tenant.

### `DELETE /api/admin/tenants/[id]`
Desactiva una organización (Soft Delete para trazabilidad).

-   **Action**: Cambia el flag `active` a `false` y registra el evento en el Audit Log.

---

## 🔐 3. Authentication Hooks (Internal)

### `GET/POST /api/auth/[...nextauth]`
Endpoints estándar de **Auth.js v5**. 
-   Maneja los flujos de `signin`, `signout`, y `csrf`.
-   Configurado con **Credentials Provider** para el ecosistema industrial.

---

## 🛡️ Estándares de Respuesta
-   **Éxito**: Código `200` o `201`.
-   **Errores de Validación**: Código `400` con detalles del esquema.
-   **Errores de Autorización**: Código `403` si el rol es insuficiente.
-   **Errores Críticos**: Código `500` (registrado silenciosamente en el Audit Log).

---
**Status**: `SYS_DOCUMENTED` | **Version**: 1.1.0

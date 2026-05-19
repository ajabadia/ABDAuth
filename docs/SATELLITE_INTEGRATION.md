# 🛰️ Guía de Integración de Satélites (SSO Federated Auth)

Este documento contiene las especificaciones técnicas completas para que aplicaciones satélite (como `ABDQuiz`, `ABDtenantGobernance`, o futuros proyectos) puedan conectarse al proveedor de identidades centralizado **ABDAuth**.

---

## 1. 🏗️ Arquitectura de Federación

El ecosistema utiliza un modelo **Federated SSO (Single Sign-On)** simplificado, apoyado en la compartición de cookies de alta seguridad a nivel de dominio y validación de sesiones vía API REST interna.

### Flujo de Vida de la Sesión
1. **Redirección**: Si un usuario intenta acceder a una ruta protegida en la aplicación Satélite sin sesión, es redirigido a `ABDAuth` (`/api/auth/federated/authorize`).
2. **Autenticación (Handshake)**: El usuario introduce sus credenciales o interactúa con el selector de múltiples empresas (Tenant Selector) en `ABDAuth`.
3. **Generación de Token**: `ABDAuth` genera una cookie segura llamada `abd_session` (que contiene el `tenantId`, `dbPrefix`, `role`, etc.) y redirige de vuelta al satélite.
4. **Validación Proxy**: El Satélite recibe la petición y lee la cookie compartida. Si requiere validación en tiempo real (por ej. si han pasado más de 60 segundos), el satélite consulta silenciosamente a `ABDAuth` a través del `Identity Bridge`.

---

## 2. 🔌 Componentes Requeridos en el Satélite

Para integrar tu nueva aplicación con `ABDAuth`, debes implementar tres piezas críticas en el código del Satélite:

### A. El Interceptor Proxy (Middleware)
Toda la lógica de seguridad y protección de rutas debe vivir en un **middleware edge-compatible** (ej. `src/proxy.ts` en Next.js). Este middleware:
- Comprueba si existe la cookie `abd_session`.
- Extrae el perfil del usuario: `tenantId`, `dbPrefix`, `role`.
- Aplica las reglas de *Tenant Isolation* verificando que el usuario pertenezca al subdominio actual (si aplica).
- Redirige al login de `ABDAuth` si no hay sesión.

### B. El Identity Bridge (Verificador Remoto)
Tu aplicación debe contar con un módulo `auth-bridge.ts` encargado de revalidar la cookie `abd_session` consultando el endpoint `/api/auth/session` de ABDAuth.

```typescript
// Ejemplo de auth-bridge.ts en un Satélite
export async function getFederatedSession(cookieString: string) {
  const verifyUrl = `${process.env.AUTH_PROVIDER_URL}/api/auth/session`;

  const response = await fetch(verifyUrl, {
    headers: { 'Cookie': cookieString },
    cache: 'no-store',
  });

  if (!response.ok) return { authenticated: false };
  return await response.json();
}
```

### C. Variables de Entorno
El satélite debe configurar las siguientes variables de entorno para apuntar al IdP correcto:
```env
# URL base del proveedor de identidad
AUTH_PROVIDER_URL=https://abd-auth.vercel.app

# Client ID asignado al Satélite en la base de datos de ABDAuth (Colección: Applications)
AUTH_CLIENT_ID=abdquiz-industrial-client-id
```

---

## 3. 🏢 Aislamiento Multitenant (Database Routing)

Una vez que el Satélite confirma la identidad, debe usar la información de la sesión para separar físicamente los datos:

- **`tenantId`**: Se debe incluir en toda la telemetría y eventos de auditoría (`logEvent()`).
- **`dbPrefix`**: Si tu base de datos centralizada usa el modelo `COLLECTION_PREFIX` (recomendado), debes pre-fijar todas las consultas a colecciones:
  ```typescript
  // Ej: Si dbPrefix es "qz_", buscará en "qz_users"
  db.collection(`${session.user.dbPrefix}users`).find({...})
  ```

---

## 4. 🧯 Front-Channel Single Sign-Out (SLO)

Para cerrar la sesión, el Satélite simplemente debe borrar su cookie `abd_session` local y redirigir al usuario al endpoint central de logout de `ABDAuth`, para que revoque la sesión en todo el ecosistema simultáneamente:

```typescript
// Ruta en el Satélite: /api/auth/logout
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const response = NextResponse.redirect(`${process.env.AUTH_PROVIDER_URL}/api/auth/logout`);
  
  // Borrar cookies locales para romper el bucle
  response.cookies.set('abd_session', '', { maxAge: 0 });
  response.cookies.set('abd_session_verified', '', { maxAge: 0 });
  
  return response;
}
```

---
**Status**: `SYS_READY` | **Standard**: `ABD-SSO-FED-11`

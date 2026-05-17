# 🧠 Lessons Learned - ABDAuth Industrial Identity

Este documento registra los retos técnicos superados y las decisiones arquitectónicas clave durante el desarrollo del Identity Provider.

## 🗓️ 05/15/2026 - MFA Engine & Audit Hardening

### 1. 🛡️ Module Resolution en Next.js 16 (Turbopack)
- **Problema**: Las exportaciones basadas en clases con estados internos (como `authenticator` de `otplib`) causan errores de pérdida de contexto (`cannot read properties of undefined (reading 'split')`) al ser invocadas desde Server Components o Middleware en entornos Turbopack.
- **Lección**: Para sistemas industriales, se debe priorizar el uso de APIs funcionales y sin estado. La migración a las funciones `generateSecret`, `generateURI` y `verify` de `otplib` v13 resolvió las inconsistencias de resolución de módulos.

### 2. 🔐 UX de Recuperación en MFA
- **Problema**: Los usuarios pueden desincronizar sus aplicaciones de autenticación al registrar múltiples veces el mismo QR. Los códigos de recuperación alfanuméricos son la única vía de escape.
- **Lección**: El input de validación de MFA debe ser flexible (alfanumérico y con longitud dinámica) y sanear la entrada (case-insensitive) para permitir códigos de backup sin fricción, evitando bloqueos de cuenta ("User Lockout").

### 3. 🔍 Falsos Positivos en Auditoría i18n
- **Problema**: Los scripts de auditoría estrictos pueden marcar palabras técnicas reservadas (ej. `Promise`) como "Hardcoded Strings" si se encuentran en archivos `.tsx`.
- **Lección**: Encapsular tipos genéricos en "Type Aliases" (ej. `type IndustrialAsyncAction = Promise<void>`) permite mantener la integridad del sistema de tipos sin disparar alertas de internacionalización falsas.

### 4. 📈 Gobernanza Proactiva vs. Reactiva
- **Problema**: Muchos usuarios ignoran las configuraciones de seguridad opcionales si solo están documentadas en el perfil.
- **Lección**: La implementación de componentes de "Soft-Nag" (ej. `MfaPromotion` banner) con diseño premium y lenguaje orientado a cumplimiento (SOC2) aumenta significativamente la adopción de medidas de seguridad antes de que sean obligatorias.

### 5. 🤖 Determinismo en el Audit Pipeline
- **Problema**: El refactorizado rápido de interfaces y tipos suele introducir "ruido" técnico (unused vars, implicit any).
- **Lección**: Un pipeline de auditoría de 6 fases (`abd-audit.ps1`) ejecutado localmente antes de cada hito garantiza que el sistema mantenga el estatus `SYS_READY` de forma continua, evitando la acumulación de deuda técnica.

### 6. 🍪 Gobernanza de Cookies en Next.js 16 (App Router)
- **Problema**: Intentar actualizar la sesión (vía `unstable_update`) directamente durante el renderizado de un Server Component dispara un error de ejecución: `Cookies can only be modified in a Server Action or Route Handler`.
- **Lección**: Las operaciones de "rescate de sesión" (donde el estado del DB contradice al JWT) deben orquestarse desde el cliente mediante una Server Action o un redireccionamiento a un Route Handler. Esto garantiza el cumplimiento con las políticas de seguridad de cookies de Next.js.

### 7. 🔌 Persistencia Singleton y Estabilidad TLS
- **Problema**: La instanciación de clientes de base de datos por cada repositorio causaba saturación de handshakes TLS, resultando en errores `SSL alert 80` en entornos Windows/Atlas.
- **Lección**: En arquitecturas de identidad, el uso de un patrón Singleton con promesas compartidas (`mongoClientPromise`) es obligatorio para mantener un pool de conexiones estable y evitar la fatiga de infraestructura por concurrencia.

### 8. 🔑 Re-autenticación en Acciones Sensibles
- **Problema**: Permitir el cambio de contraseña basado solo en una sesión activa es un riesgo de seguridad (Account Takeover vía sesión robada).
- **MFA Recovery Governance**: Recovery codes must be treated as one-time secrets with immediate invalidation upon use to prevent session hijacking.

### 🏢 Phase 4: Perimeter & Self-Service (05/15/2026)
- **Volumetric Rate Limiting**: For serverless-compatible environments (Vercel), persistent rate limiting using MongoDB with TTL indexes is more reliable than memory-based solutions, ensuring protection across build cycles and multiple instances.
- **Identity Activation Pattern**: Reusing the Password Reset infrastructure for account activation (Onboarding) is a highly efficient pattern. It ensures that the user validates their email principal and establishes their first secure secret in a single atomic flow.
- **Global Revocation Necessity**: Credential changes (Password/MFA) MUST trigger global session revocation. In a federated suite, stale sessions in satellite apps are the primary vector for post-compromise persistence.
- **Next.js 16 Redirect Handling**: When using Server Actions with `next-auth` and `next-intl`, the `NEXT_REDIRECT` error must be gracefully handled or ignored in client-side try/catch blocks to prevent false-positive error notifications during successful navigation.
- **Lección**: Toda actualización de secretos de identidad (contraseña, MFA) debe exigir la validación previa del "Auth Secret" actual, incluso si el usuario ya está autenticado, siguiendo los estándares de NIST y OWASP.

### 9. 🔌 Gobernanza de Flujos Federados SSO y Prevención de Bucles de Secuestro (SSO Dashboard Trap)

- **El Problema**: Cuando un usuario no autenticado en un satélite (como `ABDQuiz`) iniciaba sesión federada, era dirigido a `ABDAuth/api/auth/federated/authorize` y luego a `/login?callbackUrl=...`. Sin embargo, en el instante en que se completaba la autenticación y la sesión pasaba a estar activa, el middleware (`proxy.ts`) central de `ABDAuth` interceptaba la ruta pública `/login`, detectaba que `isLoggedIn` era verdadero, e ignoraba el `callbackUrl` para forzar una redirección predeterminada a `/${locale}/dashboard`. Esto "secuestraba" al usuario en el panel central de identidad, impidiendo el retorno a la aplicación satélite.
- **La Solución**: Modificar el middleware perimetral (`proxy.ts`) para que si un usuario autenticado accede a una ruta pública (`/login` o `/register`), se evalúe prioritariamente la presencia del parámetro `callbackUrl`. Si existe, se le redirige inmediatamente a dicho destino en lugar de forzar el dashboard:
  ```typescript
  if (isPublicRoute) {
    if (isLoggedIn) {
      const { searchParams } = new URL(req.url);
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl) {
        return NextResponse.redirect(new URL(callbackUrl, req.url));
      }
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }
    return intlMiddleware(req);
  }
  ```
- **Control de Cierre de Sesión Limpio**: Se determinó que el cierre de sesión debe invalidar atómicamente la sesión del Identity Provider central. Si un satélite realiza un logout local pero no destruye la cookie central de `ABDAuth`, los logins subsecuentes loguearán automáticamente al usuario anterior de forma silenciosa. Por lo tanto, el endpoint `/api/auth/logout` de `ABDAuth` debe invocarse mediante navegación a nivel de red (`<a>` nativo) para purgar de forma transparente todo el ecosistema de cookies antes de reconducir al usuario a la pantalla de despedida.

---
*Estado de la Documentación: Sincronizado*

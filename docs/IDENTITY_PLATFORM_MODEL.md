# 🏛️ ABDAuth — Modelo Teórico de Plataforma de Identidad

> Documento de referencia basado en las mejores prácticas de la industria (OWASP, Auth0, Okta, NIST, CSA).
> Objetivo: Definir el modelo completo al que aspiramos, identificar qué tenemos y qué nos falta.

---

## 1. AUTENTICACIÓN — Flujos Completos

### 1.1 Login Estándar (Email + Password)
| Aspecto | Best Practice | ABDAuth Actual | Estado |
|---|---|---|---|
| Validación de credenciales | Bcrypt/Argon2, timing-safe | ✅ Bcrypt | ✅ |
| Mensajes de error genéricos | "Credenciales inválidas" (sin revelar si el email existe) | ⚠️ Revisar | 🔍 |
| Rate limiting por IP + usuario | 3-5 intentos → throttle progresivo | ❌ No implementado | 🔴 |
| Bloqueo temporal de cuenta | 10-15 min tras N fallos, notificación al usuario | ❌ No implementado | 🔴 |
| CAPTCHA adaptativo | Tras N intentos fallidos, mostrar CAPTCHA | ❌ No implementado | 🟡 |
| Registro de intentos fallidos | Log con IP, timestamp, user-agent | ✅ AuditRepository | ✅ |
| Protección contra enumeración de usuarios | Respuesta idéntica exista o no el email | ⚠️ Revisar | 🔍 |

### 1.2 MFA — Segundo Factor
| Aspecto | Best Practice | ABDAuth Actual | Estado |
|---|---|---|---|
| TOTP (Google Authenticator) | Estándar RFC 6238 | ✅ otplib | ✅ |
| Códigos de recuperación | 8-10 códigos de un solo uso, almacenados hasheados | ✅ Implementado | ✅ |
| WebAuthn/FIDO2 (Passkeys) | Resistente a phishing, estándar moderno | ❌ No implementado | 🟡 |
| MFA obligatorio por política | Forzado por admin/org, sin escape | ✅ mfaEnforced flag | ✅ |
| Múltiples métodos registrados | Permitir >1 método MFA (TOTP + WebAuthn) | ❌ Solo TOTP | 🟡 |
| Verificación durante enrollment | Forzar 1 verificación exitosa al registrar | ✅ Implementado | ✅ |
| Cooldown tras desactivación | Período de espera antes de permitir desactivar MFA | ❌ No implementado | 🟡 |

### 1.3 Flujos de Recuperación
| Aspecto | Best Practice | ABDAuth Actual | Estado |
|---|---|---|---|
| Reset de contraseña por email | Token criptográfico, ≥64 chars, single-use, TTL 15min | ❌ No implementado | 🔴 |
| Cambio de contraseña (logueado) | Re-autenticación + validar contraseña actual | ❌ No implementado | 🔴 |
| Recuperación MFA (códigos) | Códigos de backup pre-generados | ✅ Implementado | ✅ |
| Recuperación MFA (admin) | Admin puede resetear MFA con doble autorización | ⚠️ Solo admin simple | 🟡 |
| Invalidar sesiones tras reset | Cerrar TODAS las sesiones al cambiar password | ❌ No implementado | 🔴 |
| Notificación de cambio de password | Email automático al usuario informando del cambio | ❌ No implementado | 🔴 |
| Historial de contraseñas | Impedir reutilizar las últimas N contraseñas | ❌ No implementado | 🟡 |

### 1.4 Flujos de Onboarding
| Aspecto | Best Practice | ABDAuth Actual | Estado |
|---|---|---|---|
| Invitación por email | Admin invita → usuario recibe magic link → completa perfil | ❌ No implementado | 🔴 |
| Verificación de email | Confirmar email antes de activar cuenta | ❌ No implementado | 🔴 |
| Flujo de primer login | Forzar cambio de contraseña temporal | ❌ No implementado | 🔴 |
| Auto-registro | Registro público controlado por org/tenant | ❌ No implementado | 🟡 |

---

## 2. AUTORIZACIÓN — Control de Acceso

### 2.1 RBAC (Role-Based Access Control)
| Aspecto | Best Practice | ABDAuth Actual | Estado |
|---|---|---|---|
| Roles jerárquicos | SUPER_ADMIN > ADMIN > USER | ✅ Implementado | ✅ |
| Protección de rutas por rol | Middleware/proxy con RBAC | ✅ proxy.ts | ✅ |
| Escalado de privilegios bloqueado | Admin no puede crear SUPER_ADMIN | ✅ Implementado | ✅ |
| Permisos granulares (ABAC) | Basado en atributos, no solo roles | ❌ No implementado | 🟡 |
| Separación de deberes (SoD) | Evitar que un usuario tenga permisos conflictivos | ❌ No implementado | 🟡 |

### 2.2 Multi-Tenancy
| Aspecto | Best Practice | ABDAuth Actual | Estado |
|---|---|---|---|
| Aislamiento por tenant | Cada org ve solo sus datos | ✅ TenantAwareRepository | ✅ |
| tenant_id en JWT claims | Siempre presente, validado en cada request | ✅ Implementado | ✅ |
| Gestión de organizaciones | CRUD de tenants por SUPER_ADMIN | ✅ Implementado | ✅ |
| Configuración por tenant | Políticas de password/MFA por organización | ❌ No implementado | 🟡 |

---

## 3. GESTIÓN DE SESIONES

### 3.1 Sesiones y Tokens
| Aspecto | Best Practice | ABDAuth Actual | Estado |
|---|---|---|---|
| Sesiones persistentes en DB | Registro de cada sesión activa | ✅ SessionService | ✅ |
| Revocación individual | Usuario puede cerrar una sesión concreta | ✅ Implementado | ✅ |
| Revocación masiva | "Cerrar todas las demás sesiones" | ✅ Implementado | ✅ |
| Timeout por inactividad | Auto-logout tras N minutos sin actividad | ❌ No implementado | 🔴 |
| Refresh token rotation | Rotar token en cada uso, detectar reuso | ❌ No implementado (NextAuth maneja) | 🟡 |
| Info de sesión rica | Mostrar IP, dispositivo, ubicación, última actividad | ⚠️ Parcial (Unknown) | 🟡 |
| Sincronización sesión ↔ DB | Cambios admin se reflejan en sesión activa | ✅ Recién implementado | ✅ |

### 3.2 Detección de Anomalías
| Aspecto | Best Practice | ABDAuth Actual | Estado |
|---|---|---|---|
| Login desde nueva ubicación | Notificación y/o step-up auth | ❌ No implementado | 🟡 |
| Viaje imposible | Detección de logins desde ubicaciones imposibles | ❌ No implementado | 🟡 |
| Dispositivo no reconocido | Marcar y avisar al usuario | ❌ No implementado | 🟡 |

---

## 4. PORTAL DE AUTOSERVICIO (Self-Service)

> **Estas son las funciones que un usuario normal debería poder hacer sin intervención del admin.**

| Función | Detalle | ABDAuth Actual | Estado |
|---|---|---|---|
| Ver perfil | Nombre, email, rol, org | ⚠️ Solo en JWT preview | 🟡 |
| Editar perfil | Cambiar nombre, avatar, idioma | ❌ No implementado | 🔴 |
| Cambiar contraseña | Con re-autenticación previa | ❌ No implementado | 🔴 |
| Cambiar email | Verificar nuevo email antes de aplicar | ❌ No implementado | 🔴 |
| Gestión MFA | Activar/desactivar/reconfigurar 2FA | ✅ MfaControl | ✅ |
| Ver sesiones activas | Lista con info de dispositivo/ubicación | ✅ SessionManager | ✅ |
| Cerrar sesiones | Revocar individualmente o en masa | ✅ Implementado | ✅ |
| Descargar datos personales | Export GDPR de datos propios | ❌ No implementado | 🟡 |
| Eliminar cuenta | Self-service con período de gracia | ❌ No implementado | 🟡 |

---

## 5. PANEL DE ADMINISTRACIÓN

### 5.1 Gestión de Usuarios
| Función | Detalle | ABDAuth Actual | Estado |
|---|---|---|---|
| CRUD de usuarios | Crear, editar, listar, buscar | ✅ Implementado | ✅ |
| Asignar roles | Cambiar rol desde formulario | ✅ UserForm | ✅ |
| Forzar MFA | Toggle por usuario | ✅ mfaEnforced | ✅ |
| Resetear MFA | Borrar config MFA de un usuario | ✅ adminResetMfaAction | ✅ |
| Resetear contraseña | Generar contraseña temporal o enviar link | ❌ No implementado | 🔴 |
| Bloquear/desbloquear cuenta | Suspender acceso sin eliminar | ❌ No implementado | 🔴 |
| Ver actividad de usuario | Historial de logins, cambios, eventos | ❌ No implementado (datos en audit) | 🟡 |
| Invitar usuarios | Enviar invitación por email | ❌ No implementado | 🔴 |

### 5.2 Políticas de Seguridad
| Función | Detalle | ABDAuth Actual | Estado |
|---|---|---|---|
| Política de contraseñas | Longitud mínima, complejidad, historial | ❌ Solo validación Zod básica | 🔴 |
| Política de sesión | Duración máxima, timeout inactividad | ❌ No implementado | 🔴 |
| Política MFA por org | Forzar MFA a nivel de organización completa | ❌ Solo por usuario | 🟡 |
| Whitelist de IPs | Restringir acceso por IP de origen | ❌ No implementado | 🟡 |

### 5.3 Auditoría
| Función | Detalle | ABDAuth Actual | Estado |
|---|---|---|---|
| Log de eventos | Login, logout, cambios, fallos | ✅ AuditRepository | ✅ |
| Visualización de logs | UI para consultar y filtrar | ✅ AuditPage | ✅ |
| Exportación de logs | CSV/JSON para compliance | ❌ No implementado | 🟡 |
| Alertas de seguridad | Notificación ante eventos críticos | ❌ No implementado | 🟡 |
| Retención de datos | Política de retención y purga automática | ❌ No implementado | 🟡 |

---

## 6. FEDERACIÓN SSO — Aplicaciones Satélite

> **ABDAuth como Identity Provider central para el ecosistema ABD.**

### 6.1 Registro de Aplicaciones
| Función | Detalle | ABDAuth Actual | Estado |
|---|---|---|---|
| CRUD de aplicaciones | Registrar apps satélite | ✅ ApplicationForm | ✅ |
| Client ID / Secret | Generación segura de credenciales | ✅ Implementado | ✅ |
| Scopes y permisos | Definir qué datos puede leer cada app | ⚠️ Básico | 🟡 |
| Redirect URIs validadas | Whitelist de URLs de callback | ⚠️ Revisar | 🔍 |
| Rotación de secrets | Mecanismo para rotar credenciales | ❌ No implementado | 🟡 |

### 6.2 Protocolo de Handshake
| Función | Detalle | ABDAuth Actual | Estado |
|---|---|---|---|
| OAuth2 Authorization Code | Flujo estándar para web apps | ⚠️ Implementación custom | 🟡 |
| Token exchange | JWT con claims de identidad | ✅ Implementado | ✅ |
| Token validation endpoint | Endpoint para que las apps verifiquen tokens | ⚠️ Revisar | 🔍 |
| PKCE | Protección extra para clientes públicos | ❌ No implementado | 🟡 |
| Consent screen | Pantalla de autorización explícita | ❌ No implementado | 🟡 |

---

## 7. EDGE CASES — Flujos No Ideales

> **Esta es la sección más crítica. La mayoría de bugs e incidentes de seguridad ocurren aquí.**

### 7.1 Admin se Edita a Sí Mismo
- **Escenario**: Admin cambia su propio `mfaEnforced` o `role`.
- **Riesgo**: La sesión queda desincronizada → bucle de redirección o escalado de privilegios.
- **Best Practice**: Sincronizar sesión atómicamente al detectar auto-edición.
- **ABDAuth**: ✅ Resuelto (sync en PUT /api/admin/users + syncMfaEnforcementAction).

### 7.2 Pérdida Total de Acceso (Double Loss)
- **Escenario**: Usuario pierde teléfono MFA + códigos de recuperación.
- **Best Practice**: Procedimiento de break-glass con verificación de identidad humana + aprobación dual de admins.
- **ABDAuth**: ⚠️ Parcial (admin puede resetear, pero sin doble autorización).

### 7.3 Admin Único se Bloquea
- **Escenario**: El único SUPER_ADMIN activa MFA obligatorio, pierde el dispositivo.
- **Best Practice**: Cuentas de break-glass excluidas de MFA policies + script de emergencia.
- **ABDAuth**: ✅ Parcial (script reset-mfa.ts existe, pero no hay break-glass account).

### 7.4 Sesión Envenenada
- **Escenario**: Datos en la cookie de sesión contradicen la DB (stale session).
- **Best Practice**: Server Components deben consultar DB para datos críticos, no confiar en la sesión.
- **ABDAuth**: ✅ Resuelto (SecurityPage y MfaSetupPage consultan DB directamente).

### 7.5 Cambio de Contraseña sin Invalidar Sesiones
- **Escenario**: Usuario cambia contraseña, pero las sesiones antiguas siguen activas.
- **Best Practice**: Revocar TODAS las sesiones excepto la actual al cambiar password.
- **ABDAuth**: ❌ No implementado (no hay cambio de contraseña self-service).

### 7.6 Race Condition en MFA Setup
- **Escenario**: Dos pestañas abiertas configurando MFA simultáneamente → conflicto de secrets.
- **Best Practice**: Usar `mfaPendingSecret` temporal; solo commitear al verificar.
- **ABDAuth**: ✅ Implementado (setup genera pending, enable commitea).

### 7.7 Timeout de Sesión vs. Operación Larga
- **Escenario**: La sesión expira mientras el usuario está rellenando un formulario largo.
- **Best Practice**: Refresh silencioso + guardar estado del formulario + re-auth suave.
- **ABDAuth**: ❌ No implementado.

### 7.8 Revocación de Acceso en Tiempo Real
- **Escenario**: Admin desactiva un usuario, pero este sigue logueado hasta que expire su token.
- **Best Practice**: Sesión en DB + check de validez en middleware en cada request.
- **ABDAuth**: ⚠️ Parcial (sesiones en DB pero no se validan en cada request del middleware).

---

## 8. NOTIFICACIONES Y COMUNICACIÓN

| Evento | Canal Recomendado | ABDAuth Actual | Estado |
|---|---|---|---|
| Nuevo login desde dispositivo desconocido | Email + Push | ❌ | 🔴 |
| Cambio de contraseña exitoso | Email | ❌ | 🔴 |
| MFA activado/desactivado | Email | ❌ | 🔴 |
| Intento de login fallido (N veces) | Email | ❌ | 🔴 |
| Cuenta bloqueada | Email | ❌ | 🔴 |
| Invitación a la plataforma | Email | ❌ | 🔴 |
| Sesión cerrada por admin | Email/In-app | ❌ | 🔴 |

---

## 9. COMPLIANCE Y PRIVACIDAD

| Requisito | Detalle | ABDAuth Actual | Estado |
|---|---|---|---|
| GDPR — Derecho de acceso | Exportar datos personales | ❌ | 🟡 |
| GDPR — Derecho de supresión | Eliminar cuenta y datos | ❌ | 🟡 |
| GDPR — Consentimiento | Gestión de consentimientos | ❌ | 🟡 |
| SOC2 — Logs de auditoría | Trail de eventos inmutable | ✅ | ✅ |
| SOC2 — Control de acceso | RBAC + MFA | ✅ | ✅ |
| PII Masking | Enmascarar datos sensibles en logs | ✅ PIIMasker | ✅ |

---

## 10. PRIORIZACIÓN SUGERIDA

### 🔴 Crítico — Implementar Ya
1. **Cambio de contraseña** (self-service, logueado)
2. **Reset de contraseña** (por email, con token seguro)
3. **Verificación de email** (en registro/invitación)
4. **Rate limiting** en login y endpoints sensibles
5. **Bloqueo temporal de cuentas** tras fallos
6. **Invalidación de sesiones** al cambiar password
7. **Edición de perfil** básica (nombre, apellido)

### 🟡 Importante — Siguiente Fase
1. **Invitación de usuarios** por email (magic link)
2. **Políticas de contraseña** configurables por org
3. **Timeout de sesión** por inactividad
4. **Info de sesión enriquecida** (dispositivo, ubicación, IP)
5. **Notificaciones por email** (cambio de password, nuevo login, etc.)
6. **Política MFA a nivel de organización** (no solo por usuario)
7. **Cuentas de break-glass** con doble autorización
8. **Validación de sesión** en middleware (check DB en cada request)

### ⚪ Futuro — Expansión
1. WebAuthn/Passkeys como segundo factor
2. OAuth2/OIDC compliant con PKCE
3. Consent screen para apps satélite
4. ABAC (permisos por atributos)
5. Detección de anomalías (viaje imposible, dispositivo nuevo)
6. GDPR compliance tools (export/delete)
7. Auto-registro controlado por tenant

---

## 11. RESUMEN DE ESTADO

```
┌─────────────────────────────────────┐
│ ABDAuth — Estado del Modelo         │
├─────────────────────────────────────┤
│ ✅ Implementado    : ~25 funciones  │
│ 🟡 Parcial/Futuro  : ~20 funciones │
│ 🔴 Falta Crítico   : ~12 funciones │
│ 🔍 Requiere Review : ~4 funciones  │
├─────────────────────────────────────┤
│ Cobertura estimada : ~45%          │
│ Madurez: MVP+                      │
│ Target: Industrial IdP             │
└─────────────────────────────────────┘
```

---

> **Nota**: Este documento es un modelo vivo. Se actualiza conforme se implementan funciones o se identifican nuevos requisitos. Cada sección puede derivar en su propio SPEC.md cuando se decida abordarla.

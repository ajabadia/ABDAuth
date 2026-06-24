/**
 * @purpose Gestiona la estructura para los paquetes JWT de SSO utilizados en tokens de satélite.
 * @purpose_en Defines the structure for SSO JWT payloads used in satellite tokens.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:0,sig:fullh8
 * @lastUpdated 2026-06-23T23:00:44.269Z
 */

/**
 * 🗝️ SSO JWT Payload structure for satellite tokens.
 */
export interface SsoPayload {
  sub: string;
  email: string;
  name: string;
  surname: string;
  tenantId: string;
  role: string;
  permissions: string[];
  dbPrefix: string;
  isolationStrategy: string;
  allowedApps: string[];
  groups?: string[];
  /** 🔐 Central session ID for back-channel SLO validation */
  sessionId?: string;
}

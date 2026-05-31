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

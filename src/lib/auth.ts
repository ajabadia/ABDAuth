/**
 * @purpose Gestiona autenticación y autorización utilizando adaptador MongoDB con soporte para email/password, proveedores sociales, autenticación de dos factores y gestión de sesiones.
 * @purpose_en Manages authentication and authorization using MongoDB adapter with support for email/password, social providers, two-factor authentication, and session management.
 * @refactorable true (contains too many configuration options and plugins)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:1714kgq
 * @lastUpdated 2026-06-23T22:41:05.486Z
 */

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { mongoClientPromise } from "./mongodb";

const client = await mongoClientPromise;

/**
 * 🆕 Better Auth Instance (Industrial)
 * MongoDB adapter + IndustrialUser field extensions + twoFactor plugin + nextCookies.
 */
export const auth = betterAuth({
  database: mongodbAdapter(
    client.db(process.env.MONGODB_AUTH_DB || "ABDElevators-Auth"),
    { client }
  ),
  session: {
    modelName: "sessions",
  },
  account: {
    modelName: "accounts",
    /**
     * 🔗 Account Linking (Social → Email/Password)
     * Permite que usuarios existentes vinculen cuentas sociales automáticamente
     * cuando el email coincide y está verificado por el proveedor.
     * Solo habilitado para proveedores que verifican email (Google, GitHub, Microsoft).
     */
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github", "microsoft"],
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              role: user.role || "USER",
              tenantId: user.tenantId || "temp-tenant",
              dbPrefix: user.dbPrefix || "temp",
              isolationStrategy: user.isolationStrategy || "COLLECTION_PREFIX",
              active: typeof user.active === "boolean" ? user.active : true,
              mfaEnabled: typeof user.mfaEnabled === "boolean" ? user.mfaEnabled : false,
              mfaEnforced: typeof user.mfaEnforced === "boolean" ? user.mfaEnforced : false,
              mfa_verified: typeof user.mfa_verified === "boolean" ? user.mfa_verified : false,
              loginAttempts: typeof user.loginAttempts === "number" ? user.loginAttempts : 0,
            },
          };
        },
      },
    },
  },
  user: {
    modelName: "users",
    /**
     * 🏭 IndustrialUser Field Extensions
     * Maps ABD Suite identity model to Better Auth.
     * Fields added by plugins (e.g. twoFactor → twoFactorEnabled) are managed automatically.
     */
    additionalFields: {
      surname: { type: "string", required: false },
      role: { type: "string", required: true },
      tenantId: { type: "string", required: true },
      sessionId: { type: "string", required: false },
      dbPrefix: { type: "string", required: true },
      isolationStrategy: { type: "string", required: true },
      mfaEnabled: { type: "boolean", required: true, defaultValue: false },
      mfaEnforced: { type: "boolean", required: true, defaultValue: false },
      mfa_verified: { type: "boolean", required: true, defaultValue: false },
      mfaGracePeriodActive: { type: "boolean", required: false },
      mfaGraceLoginsRemaining: { type: "number", required: false },
      mfaGraceExpiresAt: { type: "string", required: false },
      mfaGraceBypassed: { type: "boolean", required: false },
      active: { type: "boolean", required: false, defaultValue: true },
      loginAttempts: { type: "number", required: false, defaultValue: 0 },
      lockoutUntil: { type: "date", required: false },
    },
  },
  plugins: [
    twoFactor({
      // ⚙️ Configured in Phase 2; full MFA UI migration in Phase 3
      issuer: "ABD Suite",
      skipVerificationOnEnable: false,
      backupCodeOptions: {
        storeBackupCodes: "encrypted",
      },
    }),
    nextCookies(), // Enables cookie management in Server Actions
  ],
  advanced: {
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  },
  experimental: {
    joins: true,
  },
});

/**
 * @purpose Gestiona y exporta objetos de configuración para diversas aplicaciones de satélites dentro de la aplicación ABDAuth.
 * @purpose_en Manages and exports configuration objects for various satellite applications within the ABDAuth application.
 * @refactorable false
 * @classification Data/Constants
 * @complexity Low
 * @fingerprint exports:2,imports:0,sig:1ribzz
 * @lastUpdated 2026-06-26T15:32:25.366Z
 */

/* eslint-disable no-console */

export interface SatelliteAppConfig {
  clientId: string;
  name: string;
  description: string;
  clientSecret: string;
  slug: string;
  redirectUris: string[];
}

export const SATELLITES: SatelliteAppConfig[] = [
  {
    clientId: 'quiz',
    name: 'ABDQuiz Federated',
    description: 'Official industrial audit and quiz satellite.',
    clientSecret: 'abdquiz-industrial-client-secret',
    slug: 'quiz',
    redirectUris: [
      'https://abdia.es/quiz/api/abd-auth/federated/callback',
      'https://abdia.es/quiz/api/auth/federated/callback',
      'https://abdia.es/quiz',
      'https://quiz.abdia.es/api/abd-auth/federated/callback',
      'https://quiz.abdia.es/api/auth/federated/callback',
      'https://quiz.abdia.es',
      'http://localhost:5200/api/auth/federated/callback',
      'http://localhost:5200',
      'http://localhost:5020/api/auth/federated/callback',
      'http://localhost:5020',
      'https://quiz.abd.vercel.app/api/auth/federated/callback',
      'https://abd-quiz.vercel.app/api/auth/federated/callback',
      'https://abd-quiz.vercel.app',
    ],
  },
  {
    clientId: 'gobernanza',
    name: 'ABDTenantGobernance Federated',
    description: 'Official tenant governance console.',
    clientSecret: 'dev-gobernanza-client-secret',
    slug: 'gobernanza',
    redirectUris: [
      'https://abdia.es/gobernanza/api/abd-auth/federated/callback',
      'https://abdia.es/gobernanza/api/auth/federated/callback',
      'https://abdia.es/gobernanza',
      'https://tenantgobernance.abdia.es/api/abd-auth/federated/callback',
      'https://tenantgobernance.abdia.es/api/auth/federated/callback',
      'https://tenantgobernance.abdia.es',
      'http://localhost:5002/api/auth/federated/callback',
      'http://localhost:5002',
      'https://abd-tenant-gobernance.vercel.app/api/auth/federated/callback',
      'https://abd-tenant-gobernance.vercel.app',
    ],
  },
  {
    clientId: 'logs',
    name: 'ABDLogs Federated',
    description: 'Official centralized logging and auditing console.',
    clientSecret: 'dev-logs-client-secret',
    slug: 'logs',
    redirectUris: [
      'https://abdia.es/logs/api/abd-auth/federated/callback',
      'https://abdia.es/logs/api/auth/federated/callback',
      'https://abdia.es/logs',
      'https://logs.abdia.es/api/abd-auth/federated/callback',
      'https://logs.abdia.es/api/auth/federated/callback',
      'https://logs.abdia.es',
      'http://localhost:5003/api/auth/federated/callback',
      'http://localhost:5003',
      'https://abd-logs.vercel.app/api/auth/federated/callback',
      'https://abd-logs.vercel.app',
    ],
  },
  {
    clientId: 'analytics',
    name: 'ABDAnalytics Federated',
    description: 'Official centralized analytics, compliance and reporting dashboard.',
    clientSecret: 'dev-analytics-client-secret',
    slug: 'analytics',
    redirectUris: [
      'https://abdia.es/analytics/api/abd-auth/federated/callback',
      'https://abdia.es/analytics/api/auth/federated/callback',
      'https://abdia.es/analytics',
      'https://analytics.abdia.es/api/abd-auth/federated/callback',
      'https://analytics.abdia.es/api/auth/federated/callback',
      'https://analytics.abdia.es',
      'http://localhost:5004/api/auth/federated/callback',
      'http://localhost:5004',
      'https://abd-analytics.vercel.app/api/auth/federated/callback',
      'https://abd-analytics.vercel.app',
    ],
  },
  {
    clientId: 'landing',
    name: 'ABD Landing',
    description: 'Official multipurpose landing and portal page.',
    clientSecret: 'dev-landing-client-secret',
    slug: 'landing',
    redirectUris: [
      'https://abdia.es/api/abd-auth/federated/callback',
      'https://abdia.es/api/auth/federated/callback',
      'https://abdia.es',
      'https://www.abdia.es/api/abd-auth/federated/callback',
      'https://www.abdia.es/api/auth/federated/callback',
      'https://www.abdia.es',
      'https://abd-landing.vercel.app/api/abd-auth/federated/callback',
      'https://abd-landing.vercel.app/api/auth/federated/callback',
      'https://abd-landing.vercel.app',
      'http://localhost:5000/api/abd-auth/federated/callback',
      'http://localhost:5000/api/auth/federated/callback',
      'http://localhost:5000',
    ],
  },
  {
    clientId: 'files',
    name: 'ABDFiles Federated',
    description: 'Official document manager satellite.',
    clientSecret: 'dev-files-client-secret',
    slug: 'files',
    redirectUris: [
      'https://abdia.es/files/api/abd-auth/federated/callback',
      'https://abdia.es/files/api/auth/federated/callback',
      'https://abdia.es/files',
      'https://files.abdia.es/api/abd-auth/federated/callback',
      'https://files.abdia.es/api/auth/federated/callback',
      'https://files.abdia.es',
      'http://localhost:5005/api/auth/federated/callback',
      'http://localhost:5005',
      'https://abd-files.vercel.app/api/auth/federated/callback',
    ],
  },
];

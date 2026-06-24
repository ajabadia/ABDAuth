/**
 * @purpose Proporciona y exporta una lista de objetos de configuración para diversas aplicaciones de satélites dentro de la aplicación ABDAuth.
 * @purpose_en Defines and exports an array of configuration objects for various satellite applications within the ABDAuth application.
 * @refactorable false
 * @classification Data/Constants
 * @complexity Low
 * @fingerprint exports:2,imports:0,sig:10mgm7z
 * @lastUpdated 2026-06-21T12:09:16.774Z
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
      'http://localhost:5000/api/auth/federated/callback',
      'http://localhost:5000',
      'https://abd-landing.vercel.app/api/auth/federated/callback',
      'https://abd-landing.vercel.app',
      'https://abdia.es/api/auth/federated/callback',
      'https://abdia.es',
      'https://www.abdia.es/api/auth/federated/callback',
      'https://www.abdia.es',
    ],
  },
  {
    clientId: 'files',
    name: 'ABDFiles Federated',
    description: 'Official document manager satellite.',
    clientSecret: 'dev-files-client-secret',
    slug: 'files',
    redirectUris: [
      'http://localhost:5005/api/auth/federated/callback',
      'http://localhost:5005',
      'https://abd-files.vercel.app/api/auth/federated/callback',
      'https://files.abdia.es/api/auth/federated/callback',
      'https://files.abdia.es',
    ],
  },
];

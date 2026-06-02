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
    clientId: 'abdquiz-industrial-client-id',
    name: 'ABDQuiz Federated',
    description: 'Official industrial audit and quiz satellite.',
    clientSecret: 'abdquiz-industrial-super-secret-key-2026',
    slug: 'quiz',
    redirectUris: [
      'http://localhost:3300/api/auth/federated/callback',
      'http://localhost:3300',
      'https://quiz.abd.vercel.app/api/auth/federated/callback',
      'https://abd-quiz.vercel.app/api/auth/federated/callback',
      'https://abd-quiz.vercel.app',
    ],
  },
  {
    clientId: 'abdgov-industrial-client-id',
    name: 'ABDTenantGobernance Federated',
    description: 'Official tenant governance console.',
    clientSecret: 'abdgov-industrial-super-secret-key-2026',
    slug: 'gobernanza',
    redirectUris: [
      'http://localhost:3500/api/auth/federated/callback',
      'http://localhost:3500',
      'https://abd-tenant-gobernance.vercel.app/api/auth/federated/callback',
      'https://abd-tenant-gobernance.vercel.app',
    ],
  },
  {
    clientId: 'abdlogs-industrial-client-id',
    name: 'ABDLogs Federated',
    description: 'Official centralized logging and auditing console.',
    clientSecret: 'abdlogs-industrial-super-secret-key-2026',
    slug: 'logs',
    redirectUris: [
      'http://localhost:3600/api/auth/federated/callback',
      'http://localhost:3600',
      'https://abd-logs.vercel.app/api/auth/federated/callback',
      'https://abd-logs.vercel.app',
    ],
  },
  {
    clientId: 'abdanalytics-industrial-client-id',
    name: 'ABDAnalytics Federated',
    description: 'Official centralized analytics, compliance and reporting dashboard.',
    clientSecret: 'abdanalytics-industrial-super-secret-key-2026',
    slug: 'analytics',
    redirectUris: [
      'http://localhost:3700/api/auth/federated/callback',
      'http://localhost:3700',
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
      'http://localhost:3399/api/auth/federated/callback',
      'http://localhost:3399',
      'https://abd-landing.vercel.app/api/auth/federated/callback',
      'https://abd-landing.vercel.app',
      'https://abdia.es/api/auth/federated/callback',
      'https://abdia.es',
      'https://www.abdia.es/api/auth/federated/callback',
      'https://www.abdia.es',
    ],
  },
];

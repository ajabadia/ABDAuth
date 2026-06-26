/**
 * 🌱 Seed ADMIN Script — ABD Suite Local Development
 *
 * Crea en MongoDB local:
 *   1. Tenant 'abd-local' (si no existe)
 *   2. SUPER_ADMIN: admin@abd.local / Admin123!
 *   3. ADMIN: admin2@abd.local / Admin123!
 *   4. Aplicaciones satélite (quiz, gobernanza, logs, analytics)
 *
 * Uso:
 *   cd ABDAuth && node scripts/seed-admin.mjs
 *
 * Requisitos:
 *   - MongoDB corriendo en localhost:27017
 *   - ABDAuth/.env.local configurado con MONGODB_URI
 */

import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import argon2 from 'argon2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Cargar .env.local manualmente ─────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..'); // ABDAuth/

function loadEnv() {
  try {
    const envPath = path.resolve(PROJECT_ROOT, '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
      }
    }
  } catch {
    // Sin .env.local, usar defaults
  }
}

loadEnv();

// Helper: UUID sin guiones (formato que espera better-auth)
function uuid() {
  return crypto.randomUUID().replace(/-/g, '');
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const AUTH_DB = process.env.MONGODB_AUTH_DB || 'ABDElevators-Auth';

const TENANT_ID = 'abd-local';
const ALLOWED_APPS = ['quiz', 'gobernanza', 'logs', 'analytics', 'files', 'base'];

// ── Usuarios a crear ─────────────────────────────────────────────────────

const ADMINS = [
  {
    email: 'admin@abd.local',
    name: 'Super',
    surname: 'Admin',
    role: 'SUPER_ADMIN',
    password: 'Admin123!',
    tenantRole: 'owner',
  },
  {
    email: 'admin2@abd.local',
    name: 'Admin',
    surname: 'Dos',
    role: 'ADMIN',
    password: 'Admin123!',
    tenantRole: 'admin',
  },
];

// ── Satélites (coinciden con satellite-configs.ts) ───────────────────────

const SATELLITES = [
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
      'http://localhost:5000/api/auth/federated/callback',
      'http://localhost:5000/api/abd-auth/federated/callback',
      'http://localhost:5000',
      'https://abd-landing.vercel.app/api/auth/federated/callback',
      'https://abd-landing.vercel.app/api/abd-auth/federated/callback',
      'https://abd-landing.vercel.app',
      'https://abdia.es/api/auth/federated/callback',
      'https://abdia.es/api/abd-auth/federated/callback',
      'https://abdia.es',
      'https://www.abdia.es/api/auth/federated/callback',
      'https://www.abdia.es/api/abd-auth/federated/callback',
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
  {
    clientId: 'base',
    name: 'ABDBase Federated',
    description: 'Template application base.',
    clientSecret: 'dev-base-client-secret',
    slug: 'base',
    redirectUris: ['https://abdia.es/base/api/abd-auth/federated/callback', 'https://abdia.es/base/api/auth/federated/callback', 'https://abdia.es/base', 'http://localhost:3900/api/auth/federated/callback', 'http://localhost:3900'],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────

function now() { return new Date(); }

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('🌱  ABD Suite — Seed ADMIN');
  console.log('═══════════════════════════');
  console.log(`📦  MongoDB: ${MONGODB_URI}`);
  console.log(`📦  DB:      ${AUTH_DB}`);
  console.log('');

  const client = new MongoClient(MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log('✅  Conectado a MongoDB\n');

    const db = client.db(AUTH_DB);

    // ── 1. Tenant ─────────────────────────────────────────────────────
    console.log('── 1. Tenant ────────────────────────────────');
    const tenantsCol = db.collection('tenants');
    let tenant = await tenantsCol.findOne({ tenantId: TENANT_ID });

    if (!tenant) {
      const tenantDoc = {
        tenantId: TENANT_ID,
        name: 'ABD Local Development',
        industry: 'Industrial',
        dbPrefix: 'abdlocal',
        isolationStrategy: 'COLLECTION_PREFIX',
        allowedApps: ALLOWED_APPS,
        active: true,
        branding: {
          theme: { primary: '#1a73e8', secondary: '#34a853', background: '#ffffff', rounded: true, radius: '0.5rem' },
          colors: { primary: '#1a73e8', secondary: '#34a853' },
          autoDarkMode: true,
          rounded: true,
          radius: '0.5rem',
        },
        createdAt: now(),
        updatedAt: now(),
      };
      const { insertedId } = await tenantsCol.insertOne(tenantDoc);
      console.log(`✅  Tenant creado: ${TENANT_ID} (${insertedId})`);
      tenant = await tenantsCol.findOne({ tenantId: TENANT_ID });
    } else {
      console.log(`📌  Tenant ya existe: ${TENANT_ID}`);
    }

    const dbPrefix = tenant?.dbPrefix || 'abdlocal';
    console.log(`    Prefix: ${dbPrefix}\n`);

    // ── 2. Usuarios ADMIN ─────────────────────────────────────────────
    console.log('── 2. Usuarios ADMIN ─────────────────────────');
    const usersCol = db.collection('users');
    const accountsCol = db.collection('accounts');

    for (const admin of ADMINS) {
      const existing = await usersCol.findOne({ email: admin.email });

      if (existing) {
        console.log(`📌  ${admin.email} (${admin.role}) ya existe — ID: ${existing._id}`);
        continue;
      }

      console.log(`🔑  Hasheando password para ${admin.email}...`);
      const hashedPassword = await argon2.hash(admin.password);
      const userId = uuid();

      const userDoc = {
        _id: userId,
        email: admin.email,
        emailVerified: now(),
        name: admin.name,
        surname: admin.surname,
        role: admin.role,
        tenantId: TENANT_ID,
        tenantIds: [TENANT_ID],
        tenants: [{
          tenantId: TENANT_ID,
          role: admin.tenantRole,
          status: 'active',
          allowedApps: ALLOWED_APPS,
          groupIds: [],
        }],
        dbPrefix,
        isolationStrategy: 'COLLECTION_PREFIX',
        active: true,
        mfaEnabled: false,
        mfaEnforced: false,
        mfa_verified: false,
        loginAttempts: 0,
        createdAt: now(),
        updatedAt: now(),
      };

      await usersCol.insertOne(userDoc);

      await accountsCol.insertOne({
        userId,
        accountId: uuid(),
        providerId: 'email',
        password: hashedPassword,
        createdAt: now(),
        updatedAt: now(),
      });

      console.log(`✅  ${admin.email} (${admin.role}) — Password: ${admin.password}`);
    }
    console.log('');

    // ── 3. Aplicaciones Satélite ──────────────────────────────────────
    console.log('── 3. Aplicaciones Satélite ───────────────────');
    const appsCol = db.collection('applications');

    for (const sat of SATELLITES) {
      const existing = await appsCol.findOne({ clientId: sat.clientId });

      const appData = {
        clientId: sat.clientId,
        name: sat.name,
        description: sat.description,
        clientSecret: sat.clientSecret,
        slug: sat.slug,
        redirectUris: sat.redirectUris,
        active: true,
        updatedAt: now()
      };

      if (existing) {
        await appsCol.updateOne({ clientId: sat.clientId }, { $set: appData });
        console.log(`🔄  ${sat.name} actualizada`);
      } else {
        await appsCol.insertOne({
          ...appData,
          createdAt: now()
        });
        console.log(`🚀  ${sat.name} registrada`);
      }
    }
    console.log('');

    // ── Resumen ───────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════');
    console.log('🎉  SEED COMPLETADO\n');
    console.log('   Usuarios:');
    for (const admin of ADMINS) {
      console.log(`     ${admin.email.padEnd(25)} ${admin.role.padEnd(12)} ${admin.password}`);
    }
    console.log('');
    console.log('   Login:  http://localhost:5001/login');
    console.log('   Admin:  http://localhost:5020/es/admin');
    console.log('');

  } catch (err) {
    console.error('\n❌  ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌  Conexión cerrada.\n');
  }
}

main();

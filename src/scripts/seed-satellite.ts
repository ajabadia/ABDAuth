/* eslint-disable no-console */
import { applicationRepository } from '../lib/repositories/ApplicationRepository';
import fs from 'fs';
import path from 'path';

/**
 * 🌱 Satellite Seeding Script (Industrial Diagnostic Version)
 */
async function seedSatellite() {
  // 1. Manual .env.local loading
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
      });
    }
  } catch (e) {
    console.error('Failed to load .env.local:', e);
  }

  console.log('--- 🛰️ Starting Satellite Seeding ---');
  console.log('DB_URI found:', process.env.MONGODB_URI ? 'YES' : 'NO');

  try {
    const clientId = 'abdquiz-industrial-client-id';
    const existing = await applicationRepository.findByClientId(clientId);
    
    if (existing) {
      console.log('✅ Satellite already registered:', existing.name);
      process.exit(0);
    }

    const appId = await applicationRepository.create({
      name: 'ABDQuiz Federated',
      description: 'Official industrial audit and quiz satellite.',
      clientId: clientId,
      clientSecret: 'abdquiz-industrial-super-secret-key-2026',
      redirectUris: [
        'http://localhost:3300/api/auth/federated/callback',
        'https://quiz.abd.vercel.app/api/auth/federated/callback'
      ],
      active: true,
      createdAt: new Date(),
    });

    console.log('🚀 Satellite registered successfully! ID:', appId);
    process.exit(0);
  } catch (err) {
    console.error('❌ SEEDING FAILED:', err);
    process.exit(1);
  }
}

seedSatellite();

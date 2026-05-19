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
    // 1. Seed ABDQuiz
    const clientIdQuiz = 'abdquiz-industrial-client-id';
    const existingQuiz = await applicationRepository.findByClientId(clientIdQuiz);
    
    const quizData = {
      name: 'ABDQuiz Federated',
      description: 'Official industrial audit and quiz satellite.',
      clientId: clientIdQuiz,
      clientSecret: 'abdquiz-industrial-super-secret-key-2026',
      redirectUris: [
        'http://localhost:3300/api/auth/federated/callback',
        'https://quiz.abd.vercel.app/api/auth/federated/callback'
      ],
      active: true,
      updatedAt: new Date(),
    };

    if (existingQuiz) {
      console.log('🔄 ABDQuiz already registered. Updating...');
      await applicationRepository.update(existingQuiz._id, quizData);
    } else {
      await applicationRepository.create({
        ...quizData,
        createdAt: new Date(),
      });
      console.log('🚀 ABDQuiz registered successfully!');
    }

    // 2. Seed ABDtenantGobernance
    const clientIdGov = 'abdgov-industrial-client-id';
    const existingGov = await applicationRepository.findByClientId(clientIdGov);
    
    const govData = {
      name: 'ABDTenantGobernance Federated',
      description: 'Official tenant governance console.',
      clientId: clientIdGov,
      clientSecret: 'abdgov-industrial-super-secret-key-2026',
      redirectUris: [
        'http://localhost:3500/api/auth/federated/callback'
      ],
      active: true,
      updatedAt: new Date(),
    };

    if (existingGov) {
      console.log('🔄 ABDtenantGobernance already registered. Updating...');
      await applicationRepository.update(existingGov._id, govData);
    } else {
      await applicationRepository.create({
        ...govData,
        createdAt: new Date(),
      });
      console.log('🚀 ABDtenantGobernance registered successfully!');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ SEEDING FAILED:', err);
    process.exit(1);
  }
}

seedSatellite();

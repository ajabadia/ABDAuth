/**
 * @purpose Gestiona las aplicaciones de satélite en la base de datos utilizando los datos de configuración.
 * @purpose_en Seeds satellite applications into the database using configuration data.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:0,imports:4,sig:cok54d
 * @lastUpdated 2026-06-23T22:44:12.228Z
 */

/* eslint-disable no-console */
import { applicationRepository } from '../lib/repositories/ApplicationRepository';
import { SATELLITES } from './satellite-configs';
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
    for (const satellite of SATELLITES) {
      const existing = await applicationRepository.findByClientId(satellite.clientId);

      const data = {
        name: satellite.name,
        description: satellite.description,
        clientId: satellite.clientId,
        clientSecret: satellite.clientSecret,
        slug: satellite.slug,
        redirectUris: satellite.redirectUris,
        active: true,
        updatedAt: new Date(),
      };

      if (existing) {
        console.log(`🔄 ${satellite.name} already registered. Updating...`);
        await applicationRepository.update(existing._id, data);
      } else {
        await applicationRepository.create({
          ...data,
          createdAt: new Date(),
        });
        console.log(`🚀 ${satellite.name} registered successfully!`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ SEEDING FAILED:', err);
    process.exit(1);
  }
}

seedSatellite();

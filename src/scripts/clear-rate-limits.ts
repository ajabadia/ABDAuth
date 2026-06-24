/**
 * @purpose Gestiona documentos de límite de velocidad en la base de datos.
 * @purpose_en Clears all rate limit documents from the database.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:0,imports:1,sig:mubzgy
 * @lastUpdated 2026-06-21T12:09:01.523Z
 */

import { rateLimitRepository } from '../lib/repositories/RateLimitRepository';

async function main() {
  console.log('--- CLEARING RATE LIMITS START ---');
  try {
    const deletedCount = await rateLimitRepository.deleteMany({});
    console.log(`Successfully deleted ${deletedCount} rate limit documents.`);
  } catch (error) {
    console.error('Error clearing rate limits:', error);
  } finally {
    process.exit(0);
  }
}

main();

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

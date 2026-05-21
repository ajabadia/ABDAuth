import { rateLimitRepository } from '../lib/repositories/RateLimitRepository';

async function main() {
  console.log('--- TEST RATE LIMIT START ---');
  try {
    const key = 'login:::1';
    console.log('Fetching initial doc for key:', key);
    const doc = await rateLimitRepository.get(key);
    console.log('Current doc in DB via get():', doc);

    console.log('Calling increment...');
    const points = await rateLimitRepository.increment(key, 60);
    console.log('Points returned from increment:', points);

    const docAfter = await rateLimitRepository.get(key);
    console.log('Doc in DB after increment:', docAfter);
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    process.exit(0);
  }
}

main();

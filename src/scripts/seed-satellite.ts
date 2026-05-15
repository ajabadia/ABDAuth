import { applicationRepository } from '../lib/repositories/ApplicationRepository';

/**
 * 🌱 Satellite Seeding Script
 * Registers ABDQuiz as an official federated application.
 */
async function seedSatellite() {
  console.log('🛰️ Seeding Satellite: ABDQuiz...');

  const existing = await applicationRepository.findByClientId('abdquiz-industrial-client-id');
  if (existing) {
    console.log('✅ ABDQuiz already registered.');
    process.exit(0);
  }

  const appId = await applicationRepository.create({
    name: 'ABDQuiz Federated',
    description: 'Official industrial audit and quiz satellite.',
    clientId: 'abdquiz-industrial-client-id',
    clientSecret: 'abdquiz-industrial-super-secret-key-2026', // Use env in real prod
    redirectUris: [
      'http://localhost:3300/api/auth/federated/callback', // Dev
      'https://quiz.abd.vercel.app/api/auth/federated/callback' // Prod
    ],
    active: true,
    createdAt: new Date(),
  });

  console.log('🚀 ABDQuiz registered successfully with ID:', appId);
  process.exit(0);
}

seedSatellite().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

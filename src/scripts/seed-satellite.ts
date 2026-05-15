import { applicationRepository } from '../lib/repositories/ApplicationRepository';

/**
 * 🌱 Satellite Seeding Script
 * Registers ABDQuiz as an official federated application.
 */
async function seedSatellite() {
  const existing = await applicationRepository.findByClientId('abdquiz-industrial-client-id');
  if (existing) {
    process.exit(0);
  }

  await applicationRepository.create({
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

  process.exit(0);
}

seedSatellite().catch(_err => {
  process.exit(1);
});

const { loadEnvFile } = require('node:process');
const path = require('node:path');

// 🌐 Load environment variables BEFORE any other imports
try {
  loadEnvFile(path.resolve(process.cwd(), '.env.local'));
  console.log('✅ Environment variables loaded from .env.local');
} catch (e) {
  console.warn('⚠️ Could not load .env.local natively:', e.message);
}

// 📦 Use require to prevent hoisting issues and handle ESM-to-CJS interop
const UserRepoModule = require('../src/lib/repositories/UserRepository');
const MfaRepoModule = require('../src/lib/repositories/MfaRepository');

const userRepository = UserRepoModule.userRepository || UserRepoModule.default?.userRepository || UserRepoModule;
const mfaRepository = MfaRepoModule.mfaRepository || MfaRepoModule.default?.mfaRepository || MfaRepoModule;

async function resetUserMfa(email: string) {
  try {
    // Note: Repositories in this project manage their own connections via process.env
    console.log(`🔍 Searching for user: ${email}`);
    
    const user = await userRepository.findByEmail(email);
    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    const userId = user._id?.toString();
    if (!userId) {
      console.error('❌ User ID not found');
      process.exit(1);
    }

    console.log(`🛡️ Resetting MFA for user: ${user.name} (${email})`);
    
    // 1. Disable in repository
    await mfaRepository.disable(userId);
    
    // 2. Update user flag
    await userRepository.updateMfaStatus(userId, false);
    
    console.log('✅ MFA has been successfully reset. The user can now login without MFA.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting MFA:', error);
    process.exit(1);
  }
}

const targetEmail = process.argv[2] || 'ajabadia@abd.es';
resetUserMfa(targetEmail);

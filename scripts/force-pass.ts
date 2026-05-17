const { loadEnvFile } = require('node:process');
const path = require('node:path');
const bcrypt = require('bcryptjs');

try {
  loadEnvFile(path.resolve(process.cwd(), '.env.local'));
} catch {}

const UserRepoModule = require('../src/lib/repositories/UserRepository');
const userRepository = UserRepoModule.userRepository || UserRepoModule.default?.userRepository || UserRepoModule;

async function forcePassword(email, newPassword) {
  try {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      console.error(`❌ User ${email} not found`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // We need a direct update method or use the repository's update
    // userRepository.update(userId, { password: ... })
    const success = await userRepository.update(user._id.toString(), { password: hashedPassword });
    
    if (success) {
      console.log(`✅ Password for ${email} has been reset to: ${newPassword}`);
    } else {
      console.error(`❌ Failed to update password for ${email}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error forcing password:', error);
    process.exit(1);
  }
}

const email = process.argv[2] || 'ajabadia@gmail.com';
const pass = process.argv[3] || '11111111';
forcePassword(email, pass);

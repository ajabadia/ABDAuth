import { userRepository } from './src/lib/repositories/UserRepository';
import { connectToDatabase } from './src/lib/mongodb';

async function checkUserMfa() {
  await connectToDatabase();
  const email = 'ajabadia@abd.es'; // Common user in this project
  const user = await userRepository.findByEmail(email);
  
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }

  console.log('User found:', user.email);
  console.log('MFA Enabled:', user.mfaEnabled);
  console.log('MFA Secret length:', user.mfaSecret?.length || 0);
  console.log('MFA Secret:', user.mfaSecret ? 'PRESENT' : 'MISSING');
  
  process.exit(0);
}

checkUserMfa();

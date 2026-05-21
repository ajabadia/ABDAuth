import { userRepository } from "../src/lib/repositories/UserRepository";
import { auditRepository } from "../src/lib/repositories/AuditRepository";
import fs from 'fs';
import path from 'path';

async function unlock() {
  console.log("🔓 SYSTEM RECOVERY: UNLOCKING INDUSTRIAL ACCOUNT...");
  
  // Load env
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }

  try {
    const email = 'ajabadia@gmail.com';
    const user = await userRepository.findByEmail(email);
    
    if (user) {
      console.log(`👤 User found: ${user.email} (Status: ${user.active ? 'ACTIVE' : 'INACTIVE'}, Attempts: ${user.loginAttempts})`);
      
      await userRepository.update(user._id as any, {
        loginAttempts: 0,
        lockoutUntil: undefined,
        active: true // Force active for testing
      });
      
      console.log("✅ ACCOUNT UNLOCKED & RESET: SYSTEM_READY");
    } else {
      console.error("❌ USER NOT FOUND");
    }
  } catch (err) {
    console.error("❌ UNLOCK FAILED:", err);
  }
}

unlock();

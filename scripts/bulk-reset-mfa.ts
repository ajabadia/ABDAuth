/**
 * 🔄 Bulk MFA Reset Script — Phase 3 Deployment Safety Net
 *
 * During Phase 3 coexistence, the MFA login verification flow is broken
 * because authClient.twoFactor.verifyTotp() requires a better-auth session.
 * This script resets MFA for ALL users who have it enabled, so nobody gets
 * locked out after deployment.
 *
 * Usage:
 *   npx tsx scripts/bulk-reset-mfa.ts
 *   npx tsx scripts/bulk-reset-mfa.ts --dry-run    # Preview only, no changes
 *   npx tsx scripts/bulk-reset-mfa.ts --force       # Skip confirmation prompt
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// ── Env Loading ──────────────────────────────────────────────────────────────
function loadEnv(): void {
  // 🏗️ Try Node 22+ native env loading first
  if (typeof process.loadEnvFile === 'function') {
    try {
      // @ts-ignore - available in Node 22+
      process.loadEnvFile('.env.local');
      console.log('✅ Environment loaded via process.loadEnvFile');
      return;
    } catch {
      // Fall through to manual parsing
    }
  }

  // ⚙️ Manual fallback (Node <22 or error)
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  .env.local not found at', envPath);
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  });
  console.log('✅ Environment loaded from .env.local');
}

// ── Script Logic ─────────────────────────────────────────────────────────────
interface MfaUser {
  _id: unknown;
  email: string;
  name: string;
  mfaEnabled: boolean;
  mfaEnforced?: boolean;
  mfa_verified?: boolean;
}

async function bulkResetMfa(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isForce = args.includes('--force');

  console.log('');
  console.log('🔐 ================================================');
  console.log('🔐   BULK MFA RESET — Phase 3 Deployment Safety');
  console.log('🔐 ================================================');
  console.log('');

  if (isDryRun) {
    console.log('🏁 DRY RUN MODE — No changes will be made');
    console.log('');
  }

  // 1. Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  let affectedCount = 0;
  let configsPurged = 0;

  try {
    await client.connect();
    const dbName = process.env.MONGODB_AUTH_DB || 'ABDElevators-Auth';
    const db = client.db(dbName);
    const usersCollection = db.collection<MfaUser>('users');
    const mfaConfigCollection = db.collection('mfa_configs');

    // 2. Find users with MFA enabled
    const usersWithMfa = await usersCollection
      .find({ mfaEnabled: true })
      .toArray();

    console.log(`📊 Found ${usersWithMfa.length} user(s) with MFA enabled`);
    console.log('');

    if (usersWithMfa.length === 0) {
      console.log('✅ No users to reset. Exiting.');
      await client.close();
      return;
    }

    // 3. Display summary
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│ Users to be reset:                                             │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    usersWithMfa.forEach((u) => {
      const enforced = u.mfaEnforced ? '🔴 ENFORCED' : '      ';
      console.log(
        `│ • ${(u.email || '??').padEnd(32)} ${enforced.padEnd(14)} │`
      );
    });
    console.log('└─────────────────────────────────────────────────────────────────┘');
    console.log('');

    // 4. Confirm
    if (!isDryRun && !isForce) {
      console.log('⚠️  WARNING: This will reset MFA for ALL listed users.');
      console.log('   They will be able to log in without MFA verification.');
      console.log('   MFA can be re-enabled from the Security dashboard afterward.');
      console.log('');

      // Simple readline confirmation
      const { createInterface } = await import('readline');
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('🔑 Type "RESET" to confirm: ', resolve);
      });
      rl.close();

      if (answer.trim() !== 'RESET') {
        console.log('❌ Confirmation failed. Aborting.');
        await client.close();
        process.exit(0);
      }
    }

    // 5. Reset MFA for each user
    const resetFields = {
      $set: {
        mfaEnabled: false,
        mfaEnforced: false,
        mfa_verified: false,
        updatedAt: new Date(),
      },
      $unset: {
        mfaGracePeriodActive: '',
        mfaGraceLoginsRemaining: '',
        mfaGraceExpiresAt: '',
        mfaGraceBypassed: '',
      },
    };

    for (const user of usersWithMfa) {
      const userId = user._id;
      const email = user.email || 'unknown';

      if (isDryRun) {
        console.log(`  🔄 [DRY RUN] Would reset MFA for ${email}`);
        affectedCount++;
        continue;
      }

      try {
        // 5a. Reset user MFA fields
        await usersCollection.updateOne({ _id: userId }, resetFields);
        affectedCount++;

        // 5b. Delete any orphaned MFA config documents
        const deleteResult = await mfaConfigCollection.deleteMany({
          userId: userId.toString(),
        });
        configsPurged += deleteResult.deletedCount || 0;

        console.log(`  ✅ Reset ${email}${deleteResult.deletedCount > 0 ? ` (+ ${deleteResult.deletedCount} config(s) purged)` : ''}`);
      } catch (err) {
        console.error(`  ❌ Failed to reset ${email}:`, err instanceof Error ? err.message : err);
      }
    }

    // 6. Summary
    console.log('');
    console.log('═'.repeat(50));
    if (isDryRun) {
      console.log(`🏁 DRY RUN COMPLETE — ${affectedCount} user(s) would be reset`);
    } else {
      console.log(`✅ BULK MFA RESET COMPLETE`);
      console.log(`   • Users reset:     ${affectedCount}`);
      console.log(`   • Configs purged:  ${configsPurged}`);
      console.log('');
      console.log('📋 Next steps:');
      console.log('   1. Deploy Phase 3 changes');
      console.log('   2. Users can log in without MFA during coexistence');
      console.log('   3. In Phase 4, users re-enable MFA via better-auth');
    }
    console.log('═'.repeat(50));
  } catch (err) {
    console.error('❌ Script failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
loadEnv();
bulkResetMfa().catch((err) => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});

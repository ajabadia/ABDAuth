/**
 * 🎓 Seed PROFESSOR User Script
 *
 * Creates:
 * 1. A user in ABDAuth (better-auth) with role PROFESSOR + argon2 hashed password
 * 2. Account entry for password verification (better-auth format)
 * 3. A QuizUserRole entry with roleType PROFESSOR
 *
 * Usage: cd ABDAuth && node scratch/seed-professor.mjs
 */

import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import argon2 from 'argon2';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/";
const AUTH_DB = "ABDElevators-Auth";

async function run() {
  console.log('🔌 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  // Increase timeout for Atlas connections
  await client.connect();
  console.log('✅ Connected successfully\n');

  const authDb = client.db(AUTH_DB);

  // 1️⃣ Check if professor already exists
  const usersCol = authDb.collection('users');
  const existingProfessor = await usersCol.findOne({ email: 'profesor@test.com' });

  if (existingProfessor) {
    console.log(`👤 Professor already exists:`);
    console.log(`   ID:     ${existingProfessor._id}`);
    console.log(`   Role:   ${existingProfessor.role}`);
    console.log(`   Tenant: ${existingProfessor.tenantId}`);
    console.log('   Skipping creation...\n');
    await ensureQuizRole(authDb, existingProfessor);
    console.log('\n🎓 Done. Already seeded.');
    await client.close();
    return;
  }

  // 2️⃣ Find an appropriate tenant
  const tenantsCol = authDb.collection('tenants');
  const tenant = await tenantsCol.findOne({ 
    active: { $ne: false },
    tenantId: { $nin: ['system', 'abd_global'] }
  }) || await tenantsCol.findOne({ active: { $ne: false } });

  if (!tenant) {
    console.error('❌ No active tenants found.');
    await client.close();
    return;
  }

  console.log(`🏢 Tenant: ${tenant.name} (${tenant.tenantId})`);
  console.log(`   DB Prefix: ${tenant.dbPrefix}\n`);

  const now = new Date();

  // 3️⃣ Argon2 hash the password
  console.log('🔑 Hashing password with argon2...');
  const hashedPassword = await argon2.hash('11111111');
  console.log('✅ Password hashed\n');

  // 4️⃣ Create professor user
  const userDoc = {
    email: 'profesor@test.com',
    emailVerified: true,
    name: 'Carlos',
    surname: 'Profesor Test',
    role: 'PROFESSOR',
    tenantId: tenant.tenantId,
    tenantIds: [tenant.tenantId],
    tenants: [{
      tenantId: tenant.tenantId,
      role: 'admin',
      status: 'active',
      allowedApps: ['abd-quiz'],
      groupIds: []
    }],
    dbPrefix: tenant.dbPrefix,
    isolationStrategy: tenant.isolationStrategy || 'COLLECTION_PREFIX',
    active: true,
    mfaEnabled: false,
    mfaEnforced: false,
    mfa_verified: false,
    loginAttempts: 0,
    createdAt: now,
    updatedAt: now
  };

  const { insertedId } = await usersCol.insertOne(userDoc);
  const userId = insertedId.toString();
  console.log(`✅ User created:`);
  console.log(`   ID:       ${userId}`);
  console.log(`   Role:     PROFESSOR`);
  console.log(`   Password: 11111111\n`);

  // 5️⃣ Create account entry (better-auth email/password login)
  const accountsCol = authDb.collection('accounts');
  await accountsCol.insertOne({
    userId: userId,
    accountId: crypto.randomUUID(),
    providerId: 'email',
    password: hashedPassword,
    createdAt: now,
    updatedAt: now
  });
  console.log('✅ Account entry created\n');

  // 6️⃣ Create QuizUserRole
  await ensureQuizRole(authDb, { ...userDoc, _id: insertedId, userId });

  console.log('\n🎓 === SEED COMPLETE ===');
  console.log('   Email:    profesor@test.com');
  console.log('   Password: 11111111');
  console.log('   Role:     PROFESSOR');
  console.log('   Tenant:   ' + tenant.tenantId);
  console.log('');
  console.log('👉 Login at http://localhost:5001/login');
  console.log('👉 Then access: http://localhost:5020/es/admin');

  await client.close();
}

async function ensureQuizRole(authDb, user) {
  const userId = user.userId || user._id.toString();
  const tenantId = user.tenantId;
  const dbPrefix = user.dbPrefix || 'abdelevators';

  const collectionName = `${dbPrefix}_quizuserroles`;
  const quizUserRolesCol = authDb.collection(collectionName);

  const scopeId = 'test-scope-professor-001';
  const existing = await quizUserRolesCol.findOne({
    userId,
    tenantId,
    scopeId
  });

  if (existing) {
    console.log(`✅ QuizUserRole exists: ${existing.roleType} @ ${scopeId}`);
    return;
  }

  const now = new Date();
  await quizUserRolesCol.insertOne({
    tenantId,
    userId,
    scopeType: 'course',
    scopeId,
    roleType: 'PROFESSOR',
    createdAt: now,
    updatedAt: now
  });
  console.log(`✅ QuizUserRole: PROFESSOR @ ${scopeId} (collection: ${collectionName})`);

  // Also try default_ prefix (used by default tenant)
  try {
    const defaultCol = authDb.collection(`default_quizuserroles`);
    await defaultCol.insertOne({
      tenantId,
      userId,
      scopeType: 'course',
      scopeId,
      roleType: 'PROFESSOR',
      createdAt: now,
      updatedAt: now
    });
    console.log(`✅ Also added to default_quizuserroles`);
  } catch {
    // Collection may not exist, that's fine
  }
}

run().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});

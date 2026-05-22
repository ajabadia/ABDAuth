import { applicationRepository } from '../lib/repositories/ApplicationRepository';
import { userRepository } from '../lib/repositories/UserRepository';
import { auditRepository } from '../lib/repositories/AuditRepository';
import { rateLimitRepository } from '../lib/repositories/RateLimitRepository';

async function main() {
  console.log('--- DB INSPECTION START ---');
  try {
    const apps = await applicationRepository.list({});
    console.log('\n--- REGISTERED APPLICATIONS ---');
    for (const app of apps) {
      console.log({
        name: app.name,
        clientId: app.clientId,
        slug: app.slug,
        redirectUris: app.redirectUris,
        active: app.active,
      });
    }

    const users = await userRepository.list({});
    console.log('\n--- USERS ---');
    for (const user of users) {
      console.log({
        email: user.email,
        name: user.name,
        role: user.role,
        active: user.active,
        tenantId: user.tenantId,
        tenants: user.tenants,
      });
    }

    const limits = await rateLimitRepository.list({});
    console.log('\n--- RATE LIMITS ---');
    for (const lim of limits) {
      console.log({
        key: lim.key,
        points: lim.points,
        expireAt: lim.expireAt,
      });
    }

    const audits = await auditRepository.list({});
    // Sort in memory by timestamp descending and take the last 15
    const recentAudits = audits
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 15);

    console.log('\n--- RECENT AUDIT LOGS ---');
    for (const log of recentAudits) {
      console.log({
        timestamp: log.createdAt,
        event: log.action,
        actorEmail: log.userEmail,
        status: (log.changedFields || {}).status,
        metadata: log.changedFields,
      });
    }
  } catch (error) {
    console.error('❌ DB Inspection Error:', error);
  } finally {
    process.exit(0);
  }
}

main();


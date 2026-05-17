const { loadEnvFile } = require('node:process');
const path = require('node:path');

try {
  loadEnvFile(path.resolve(process.cwd(), '.env.local'));
} catch {}

const { auditRepository } = require('../src/lib/repositories/AuditRepository');

async function checkRecentLogs() {
  try {
    const logs = await auditRepository.list();
    const recent = logs.slice(-10).reverse();
    
    console.log('--- RECENT AUDIT LOGS ---');
    recent.forEach(log => {
      console.log(`[${log.timestamp.toISOString()}] ${log.event} - ${log.actorEmail} - Status: ${log.status}`);
      if (log.metadata) console.log(`   Metadata: ${JSON.stringify(log.metadata)}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error reading logs:', error);
    process.exit(1);
  }
}

checkRecentLogs();

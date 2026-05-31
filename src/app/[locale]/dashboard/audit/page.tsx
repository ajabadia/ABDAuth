import { getServerSession } from '@/lib/get-session';
import { redirect } from "next/navigation";

/**
 * 📜 Audit Log Redirect
 * Redirects dynamically to the centralized audit logging service (ABDLogs)
 */
export default async function AuditPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { locale } = await params;

  // 🔍 Derive central logs audit URL dynamically
  const logsServiceUrl = process.env.LOGS_SERVICE_URL || 'http://localhost:3600/api/logs';
  let logsAuditUrl = '';
  try {
    const logsOrigin = new URL(logsServiceUrl).origin;
    logsAuditUrl = `${logsOrigin}/${locale}/admin/audit`;
  } catch (err) {
    console.error("Failed to parse LOGS_SERVICE_URL:", err);
    logsAuditUrl = `http://localhost:3600/${locale}/admin/audit`;
  }

  redirect(logsAuditUrl);
}

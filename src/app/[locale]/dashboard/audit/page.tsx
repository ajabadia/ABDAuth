/**
 * @purpose Gestiona el redireccionamiento a un servicio de registro de auditoria centralizado según el idioma del usuario y el estado de sesión.
 * @purpose_en Manages the redirection to a centralized audit logging service based on the user's locale and session status.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:bl9r68
 * @lastUpdated 2026-06-23T22:39:45.372Z
 */

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
  const logsServiceUrl = process.env.LOGS_SERVICE_URL || 'http://localhost:5003/api/logs';
  let logsAuditUrl = '';
  try {
    const logsOrigin = new URL(logsServiceUrl).origin;
    logsAuditUrl = `${logsOrigin}/${locale}/admin/audit`;
  } catch (err) {
    console.error("Failed to parse LOGS_SERVICE_URL:", err);
    logsAuditUrl = `http://localhost:5003/${locale}/admin/audit`;
  }

  redirect(logsAuditUrl);
}

/**
 * @purpose Gestiona el manejo de los inquilinos redirigiendo a los usuarios al plano de control para la administración de inquilinos.
 * @purpose_en Manages tenant management by redirecting users to the control plane for tenant administration.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1iqapi
 * @lastUpdated 2026-06-23T22:39:56.219Z
 */

import { getServerSession } from '@/lib/get-session';
import { redirect } from "next/navigation";

/**
 * 🏢 Industrial Tenant Management Panel (Deprecate & Redirect to Control Plane)
 */
export default async function TenantsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await getServerSession();
  const { locale } = await params;

  if (!session) {
    redirect("/login");
  }

  const controlPlaneUrl = process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://abd-tenant-gobernance.vercel.app' 
      : 'http://localhost:5002');

  redirect(`${controlPlaneUrl}/${locale}/admin/tenants`);
}

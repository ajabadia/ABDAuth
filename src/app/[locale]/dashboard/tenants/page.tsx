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

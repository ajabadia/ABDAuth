import { auth } from '@/auth';
import { redirect } from '@/i18n/routing';

/**
 * 🏠 Root Entry Point (Localized)
 * Redirects to dashboard if logged in, otherwise to login.
 * Uses localized redirect from i18n/routing with correct object signature.
 */
export default async function RootPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  const session = await auth();
  
  if (!session) {
    redirect({ href: '/login', locale });
  } else {
    redirect({ href: '/dashboard', locale });
  }
}

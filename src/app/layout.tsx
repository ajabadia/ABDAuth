import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@ajabadia/styles/dist/styles/industrial-core.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { ThemeScript, generateTenantCss } from "@ajabadia/styles";
import { tenantRepository } from "@/lib/repositories/TenantRepository";
import type { TenantId } from "@/lib/schemas/common";
import type { IndustrialUser } from "@/types/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ABDAuth | Industrial Identity Gateway",
  description: "Secure, high-fidelity identity management system for the ABD Industrial Ecosystem.",
  icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  // 🆕 Better Auth session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 🎨 Multi-Tenant Cohesive Branding: Dynamically compile HSL variables for the active Tenant
  let customCss = "";
  const cookieStore = await cookies();
  let activeTenantId = cookieStore.get('active_tenant_id')?.value || "";
  
  if (!activeTenantId && session?.user) {
    activeTenantId = (session.user as unknown as IndustrialUser).tenantId || "";
  }

  if (activeTenantId) {
    try {
      const tenant = await tenantRepository.findByTenantId(activeTenantId as TenantId);
      if (tenant?.branding?.theme) {
        customCss = generateTenantCss(tenant.branding.theme);
      }
    } catch (err) {
      console.error("Failed to retrieve tenant branding from database:", err);
    }
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <style id="tenant-branding-gateway" dangerouslySetInnerHTML={{ __html: customCss }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased navbar-top-layout selection:bg-primary/30`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {/* Progress bar: reactivo a navegación SPA (z-index 45 por §10.E) */}
          <NextTopLoader
            color="hsl(var(--primary))"
            height={2}
            showSpinner={false}
            zIndex={45}
            speed={200}
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {/* ✅ Better Auth — no SessionProvider needed; authClient.useSession() is reactive via nano-stores */}
            {children}
            <Toaster position="top-right" richColors closeButton theme="dark" />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

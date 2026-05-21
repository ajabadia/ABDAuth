import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { Toaster } from "sonner";
import { generateTenantCss } from "@abd/styles";
import { tenantRepository } from "@/lib/repositories/TenantRepository";
import type { TenantId } from "@/lib/schemas/common";

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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await auth();

  // 🎨 Multi-Tenant Cohesive Branding: Dynamically compile HSL variables for the logged-in User
  let customCss = "";
  if (session?.user && "tenantId" in session.user) {
    const tenantId = (session.user as { tenantId?: string }).tenantId;
    if (tenantId) {
      try {
        const tenant = await tenantRepository.findByTenantId(tenantId as TenantId);
        if (tenant?.branding?.theme) {
          customCss = generateTenantCss(tenant.branding.theme);
        }
      } catch (err) {
        console.error("Failed to retrieve tenant branding from database:", err);
      }
    }
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {customCss ? (
          <style id="tenant-branding-gateway" dangerouslySetInnerHTML={{ __html: customCss }} />
        ) : null}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-primary/30`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <SessionProvider session={session} basePath="/api/auth">
              {children}
              <Toaster position="top-right" richColors closeButton theme="dark" />
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

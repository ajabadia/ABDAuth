/**
 * @purpose Gestiona el layout principal para la aplicación ABDAuth, manejando autenticación, marca de tenant y internacionalización.
 * @purpose_en Renders the main layout for the ABDAuth application, handling authentication, tenant branding, and internationalization.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:7,sig:19sq2fr
 * @lastUpdated 2026-06-30T05:48:55.851Z
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getLocale } from 'next-intl/server';
import { getIndustrialSession, BrandingStyles, configureLogger } from "@ajabadia/satellite-sdk";
import { SessionProvider } from "@ajabadia/satellite-sdk/client";
import { ThemeProvider } from "@ajabadia/ecosystem-widgets";

configureLogger({
  endpoint: process.env.LOGS_SERVICE_URL || 'http://localhost:5003/api/logs',
  token: process.env.LOGS_SECRET_TOKEN,
  appId: 'ABDAuth',
});

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
  const session = await getIndustrialSession();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <BrandingStyles />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased navbar-top-layout selection:bg-primary/30`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionProvider initialSession={session}>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

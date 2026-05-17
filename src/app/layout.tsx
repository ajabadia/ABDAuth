import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} antialiased selection:bg-blue-500/30`} suppressHydrationWarning>
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

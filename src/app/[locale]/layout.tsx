import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

/**
 * 🌍 Locale Layout (Industrial)
 * Provides internationalization context to all localized routes.
 * Messages are fetched server-side and passed to the client provider.
 */
export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 🛡️ Integrity Check
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  // 📦 Load messages with explicit typing
  const messages = (await getMessages()) as AbstractIntlMessages;

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}

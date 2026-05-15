import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

/**
 * 🌐 i18n Request Configuration
 * Orchestrates message loading based on the active locale.
 * Adheres to the [locale] directory structure standards.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // 1. Await the locale from the context (Next.js 15+ standard)
  let locale = await requestLocale;
 
  // 2. Validate against authorized locales
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }
 
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

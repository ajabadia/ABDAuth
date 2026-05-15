/**
 * 🌍 Centralized i18n configuration for ABDAuth.
 */
export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: SupportedLocale = 'es';

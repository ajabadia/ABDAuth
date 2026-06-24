/**
 * @purpose Gestiona locales soportados y configuración del locale por defecto para internacionalización en ABDAuth.
 * @purpose_en Manages supported locales and default locale configuration for internationalization in ABDAuth.
 * @refactorable false
 * @classification Data/Constants
 * @complexity Low
 * @fingerprint exports:3,imports:0,sig:pupl83
 * @lastUpdated 2026-06-23T22:41:20.062Z
 */

/**
 * 🌍 Centralized i18n configuration for ABDAuth.
 */
export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: SupportedLocale = 'es';

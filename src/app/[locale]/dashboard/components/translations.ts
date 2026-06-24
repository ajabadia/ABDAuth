/**
 * @purpose Gestiona traducciones para el componente lanzador de aplicaciones según la ubicación.
 * @purpose_en Manages translations for the application launcher component based on the locale.
 * @refactorable false
 * @classification Data/Constants
 * @complexity Low
 * @fingerprint exports:1,imports:0,sig:zax329
 * @lastUpdated 2026-06-21T10:21:09.247Z
 */

export const getAppLauncherTranslations = (locale: string) => locale === 'es' ? {
  launcher_title: 'APLICACIONES AUTORIZADAS',
  launcher_subtitle: 'TERMINAL DE LANZAMIENTO SSO DIRECTO',
  launch_btn: 'INICIAR ACCESO SATÉLITE',
  no_apps: 'No hay aplicaciones licenciadas para este Tenant',
  licensed_apps: 'LICENCIA ACTIVA',
} : {
  launcher_title: 'AUTHORIZED APPLICATIONS',
  launcher_subtitle: 'DIRECT SSO LAUNCH CONSOLE',
  launch_btn: 'LAUNCH SATELLITE ACCESS',
  no_apps: 'No applications licensed for this tenant',
  licensed_apps: 'ACTIVE LICENSE',
};

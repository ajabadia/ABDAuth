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

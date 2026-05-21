export const getTenantSelectorTranslations = (locale: string) => locale === 'es' ? {
  select_tenant: 'CONMUTACIÓN DE CONTEXTO TENANT',
  active_context: 'Contexto Activo',
  loading: 'CONMUTANDO',
  error_switching: 'ERROR DE CONMUTACIÓN',
} : {
  select_tenant: 'TENANT CONTEXT SWITCHER',
  active_context: 'Active Context',
  loading: 'SWITCHING',
  error_switching: 'SWITCH_FAILED',
};

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

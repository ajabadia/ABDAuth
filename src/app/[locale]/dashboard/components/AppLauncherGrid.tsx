/**
 * @purpose Renderiza una red de elementos del lanzador de aplicaciones con iconos, descripciones y botones de lanzamiento.
 * @purpose_en Renders a grid of application launcher items with icons, descriptions, and launch buttons.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:i9d60v
 * @lastUpdated 2026-06-21T14:51:59.197Z
 */

import React from 'react';
import { ExternalLink, HelpCircle, Award, Layers, Activity } from 'lucide-react';

interface ApplicationItem {
  slug?: string;
  name: string;
  description?: string;
  active: boolean;
}

const getAppIcon = (slug?: string) => {
  const norm = slug?.toLowerCase() || '';
  if (norm.includes('quiz')) return <Award size={18} />;
  if (norm.includes('gobernanza') || norm.includes('govern')) return <Layers size={18} />;
  if (norm.includes('monitor') || norm.includes('telemet')) return <Activity size={18} />;
  return <ExternalLink size={18} />;
};

export function AppLauncherGrid({
  apps,
  activeTenantId,
  translations,
}: {
  apps: ApplicationItem[];
  activeTenantId: string;
  translations: {
    launcher_title: string;
    launcher_subtitle: string;
    launch_btn: string;
    no_apps: string;
    licensed_apps: string;
  };
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          {translations.launcher_title} • <span className="text-primary">{activeTenantId}</span>
        </h3>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {translations.launcher_subtitle}
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="bg-secondary/10 border border-border p-8 text-center rounded-none">
          <HelpCircle className="mx-auto text-muted-foreground/40 mb-3" size={24} />
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            {translations.no_apps}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => {
            const icon = getAppIcon(app.slug);
            const ssoUrl = `/api/auth/sso?appId=${app.slug || app.name.toLowerCase()}&tenantId=${activeTenantId}`;

            return (
              <a
                key={app.name}
                href={ssoUrl}
                className="bg-card border border-border p-5 rounded-none flex items-start gap-4 group hover:border-primary/40 transition-all duration-300 relative overflow-hidden flex-col justify-between h-44 text-left"
              >
                {/* Visual glow backdrop for premium interface */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

                <div className="flex items-center gap-3 w-full relative z-10">
                  <div className="w-9 h-9 rounded-none flex items-center justify-center border border-border bg-secondary/20 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary transition-all duration-300">
                    {icon}
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-muted-foreground/50 uppercase tracking-widest block">
                      {translations.licensed_apps}
                    </span>
                    <h4 className="text-sm font-bold uppercase tracking-tight text-foreground group-hover:text-primary transition-colors mt-0.5">
                      {app.name}
                    </h4>
                  </div>
                </div>

                <p className="text-[11px] font-sans text-muted-foreground leading-normal line-clamp-2 relative z-10 w-full">
                  {app.description || 'No description configured for this satellite application.'}
                </p>

                <div className="text-[9px] font-mono font-black text-primary uppercase tracking-widest flex items-center gap-1.5 border-t border-border/30 pt-3 w-full relative z-10">
                  {translations.launch_btn}
                  <ExternalLink size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

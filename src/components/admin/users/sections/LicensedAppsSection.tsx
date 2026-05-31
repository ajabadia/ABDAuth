import { HelpCircle, Settings } from 'lucide-react';

interface LicensedAppsSectionProps {
  licensedApps: string[];
  allowedApps: string[];
  role: string;
  onUpdate: (updates: { allowedApps: string[] }) => void;
  t: { form: { allowed_apps: string; no_apps_for_tenant: string } };
}

export function LicensedAppsSection({ licensedApps, allowedApps, role, onUpdate, t }: LicensedAppsSectionProps) {
  const isInherited = role === 'admin' || role === 'owner';

  return (
    <div className="space-y-2">
      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
        <Settings size={10} />
        {t.form.allowed_apps}
      </span>

      {licensedApps.length === 0 ? (
        <p className="text-[10px] text-destructive/80 italic pl-1 font-semibold flex items-center gap-1.5">
          <HelpCircle size={12} />
          {t.form.no_apps_for_tenant}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-secondary/5 border border-border/40 rounded-none">
          {licensedApps.map((app) => {
            const isChecked = allowedApps.includes(app);
            return (
              <label
                key={app}
                className={`flex items-center gap-2 select-none group text-xs text-foreground ${
                  isInherited ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isInherited ? true : isChecked}
                  disabled={isInherited}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const updatedApps = checked
                      ? [...allowedApps, app]
                      : allowedApps.filter((a) => a !== app);
                    onUpdate({ allowedApps: updatedApps });
                  }}
                  className="rounded-none border-border text-primary focus:ring-primary focus:ring-offset-background"
                />
                <span className="font-mono text-[9px] tracking-wide text-muted-foreground group-hover:text-foreground transition-colors uppercase">
                  {app} {isInherited && <span className="text-[8px] text-primary/70 font-sans italic lowercase">(inherited)</span>}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

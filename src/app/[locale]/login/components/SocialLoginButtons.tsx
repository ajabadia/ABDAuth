/**
 * @purpose Gestiona un conjunto de botones para opciones de login social, maneja el proceso de autenticación y muestra estados de carga.
 * @purpose_en Renders a set of buttons for social login options, handling the authentication process and displaying loading states.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:14k0o1p
 * @lastUpdated 2026-06-21T10:25:02.708Z
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { SOCIAL_PROVIDERS } from './social-providers';

interface SocialLoginButtonsProps {
  t: (key: string) => string;
}

export function SocialLoginButtons({ t }: SocialLoginButtonsProps) {
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);
    try {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl') || '/dashboard';
      await authClient.signIn.social({
        provider: provider as 'google' | 'github' | 'microsoft',
        callbackURL: callbackUrl,
      });
    } catch (error) {
      console.error('Social login failed:', error);
      toast.error(t('error_generic'), { description: t(`social.${provider}`) });
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <>
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/30" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-[8px] font-mono font-black text-muted-foreground uppercase tracking-[0.2em]">
            {t('social.divider')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {SOCIAL_PROVIDERS.map((provider) => (
          <button key={provider.id} type="button" disabled={socialLoading !== null}
            onClick={() => handleSocialLogin(provider.id)}
            aria-label={t(`social.${provider.id}`)}
            className="flex items-center justify-center h-10 bg-secondary/20 border border-border rounded-none hover:border-primary/40 hover:bg-secondary/30 hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.15)] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {socialLoading === provider.id ? (
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            ) : (
              <span className="text-muted-foreground group-hover:text-primary transition-colors">
                <provider.icon />
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}

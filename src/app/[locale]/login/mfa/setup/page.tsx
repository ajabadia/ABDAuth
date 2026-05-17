import React from 'react';
import { getTranslations, getLocale } from 'next-intl/server';
import { auth } from '@/auth';
import { MfaSetupContainer } from './MfaSetupContainer';
import { redirect } from '@/i18n/routing';
import { userRepository } from '@/lib/repositories/UserRepository';
import { MfaService } from '@/services/auth/MfaService';
import type { IndustrialUser } from '@/types/auth';
import type { EntityId } from '@/lib/schemas/common';

export default async function MfaSetupPage() {
  const session = await auth();
  const user = session?.user as IndustrialUser;
  const locale = (await getLocale());

  // 🛡️ Redirect if already enabled or if enforcement was removed in DB
  const isEnabled = await MfaService.isRequired(user.id);
  const dbUser = await userRepository.findById(user.id as EntityId);
  const isCurrentlyEnforced = dbUser?.mfaEnforced ?? user.mfaEnforced;

  // 🛡️ Rescue Logic: If not enforced anymore but session thinks it is, we need sync
  const needsSync = !isCurrentlyEnforced && user.mfaEnforced;

  if (isEnabled && !needsSync) {
    redirect({ href: '/dashboard', locale });
    return null;
  }

  const t = await getTranslations('login.mfa_setup');

  const translations = {
    title: t('title'),
    description: t('description'),
    cancel_logout: t('cancel_logout'),
  };

  return (
    <MfaSetupContainer 
      t={translations} 
      isMandatory={isCurrentlyEnforced} 
      needsSync={needsSync}
    />
  );
}

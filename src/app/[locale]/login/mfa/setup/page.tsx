/**
 * @purpose Gestiona la página de configuración de autenticación multifactor para los usuarios, maneja las redirectiones según el estado del MFA y recupera las traducciones necesarias.
 * @purpose_en Renders the Multi-Factor Authentication setup page for users, handling redirections based on user MFA status and fetching necessary translations.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:8,sig:yxapm9
 * @lastUpdated 2026-06-21T12:03:08.808Z
 */

import React from 'react';
import { getTranslations, getLocale } from 'next-intl/server';
import { getServerSession } from '@/lib/get-session';
import { MfaSetupContainer } from './MfaSetupContainer';
import { redirect } from '@/i18n/routing';
import { userRepository } from '@/lib/repositories/UserRepository';
import type { IndustrialUser } from '@/types/auth';
import type { EntityId } from '@/lib/schemas/common';

export default async function MfaSetupPage() {
  const session = await getServerSession();
  const user = session?.user as IndustrialUser;
  const locale = (await getLocale());

  // 🛡️ Redirect if already enabled or if enforcement was removed in DB
  const dbUser = await userRepository.findById(user.id as EntityId);
  const isCurrentlyEnforced = dbUser?.mfaEnforced ?? user.mfaEnforced;

  // 🛡️ Rescue Logic: If not enforced anymore but session thinks it is, we need sync
  const needsSync = !isCurrentlyEnforced && user.mfaEnforced;

  if ((dbUser?.mfaEnabled ?? false) && !needsSync) {
    redirect({ href: '/dashboard', locale });
    return null;
  }

  const t = await getTranslations('login.mfa_setup');

  const translations = {
    title: t('title'),
    description: t('description'),
    cancel_logout: t('cancel_logout'),
  };

  const mfaGracePeriodActive = dbUser?.mfaGracePeriodActive ?? false;
  const mfaGraceLoginsRemaining = dbUser?.mfaGraceLoginsRemaining ?? 0;
  const mfaGraceExpiresAt = dbUser?.mfaGraceExpiresAt ? new Date(dbUser.mfaGraceExpiresAt).toLocaleDateString(locale) : '';

  return (
    <MfaSetupContainer 
      t={translations} 
      isMandatory={isCurrentlyEnforced} 
      needsSync={needsSync}
      isAuthenticated={!!session}
      mfaGracePeriodActive={mfaGracePeriodActive}
      mfaGraceLoginsRemaining={mfaGraceLoginsRemaining}
      mfaGraceExpiresAt={mfaGraceExpiresAt}
    />
  );
}

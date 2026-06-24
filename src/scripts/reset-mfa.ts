/**
 * @purpose Gestiona el reset de Autenticación Múltiple (MFA) para un usuario actualizando su estado de MFA en la base de datos.
 * @purpose_en Manages the reset of Multi-Factor Authentication (MFA) for a user by updating their MFA status in the database.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:0,imports:1,sig:xqykq8
 * @lastUpdated 2026-06-23T22:44:05.401Z
 */

import { userRepository } from '../lib/repositories/UserRepository';

/**
 * 🧹 MFA Reset CLI Tool
 * Usage: npx tsx --env-file=.env.local src/scripts/reset-mfa.ts <email>
 *
 * Phase 3: Uses MfaService.disable() instead of the deleted MfaRepository.
 * Better-auth's twoFactor plugin manages TOTP secrets internally.
 */
async function resetMfa() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Se requiere el email del usuario.'); // eslint-disable-line no-console
    console.log('Uso: npx tsx --env-file=.env.local src/scripts/reset-mfa.ts usuario@ejemplo.com'); // eslint-disable-line no-console
    process.exit(1);
  }

  try {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      console.error(`❌ Error: No se encontró ningún usuario con el email: ${email}`); // eslint-disable-line no-console
      process.exit(1);
    }

    const userId = user._id?.toString();
    if (!userId) throw new Error('User ID missing');

    console.log(`🛡️ Reseteando MFA para: ${user.name} (${email})...`); // eslint-disable-line no-console

    // 1. Desactivar MFA mediante userRepository
    await userRepository.updateMfaStatus(userId, false);

    console.log('✅ Éxito: El MFA ha sido desactivado. El usuario podrá configurar uno nuevo en su próximo acceso.'); // eslint-disable-line no-console
    process.exit(0);
  } catch (error) {
    console.error('❌ Error crítico:', error); // eslint-disable-line no-console
    process.exit(1);
  }
}

resetMfa();

import { mfaRepository } from '../lib/repositories/MfaRepository';
import { userRepository } from '../lib/repositories/UserRepository';

/**
 * 🧹 MFA Reset CLI Tool
 * Usage: npx tsx --env-file=.env.local src/scripts/reset-mfa.ts <email>
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

    // 1. Eliminar configuración de MFA
    await mfaRepository.disable(userId);

    // 2. Desactivar flag en el usuario
    await userRepository.updateMfaStatus(userId, false);

    console.log('✅ Éxito: El MFA ha sido desactivado. El usuario podrá configurar uno nuevo en su próximo acceso.'); // eslint-disable-line no-console
    process.exit(0);
  } catch (error) {
    console.error('❌ Error crítico:', error); // eslint-disable-line no-console
    process.exit(1);
  }
}

resetMfa();

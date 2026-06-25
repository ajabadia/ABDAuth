/**
 * @purpose Gestiona el activado de una cuenta de usuario mediante la validación del token, cifrado de la contraseña y actualización del estado del usuario.
 * @purpose_en Handles the activation of a user account by validating the token, hashing the password, and updating the user's status.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:16qauvo
 * @lastUpdated 2026-06-25T10:16:31.330Z
 */

'use server'

import { logger } from '@ajabadia/satellite-sdk/logger';;
import { userRepository } from "@/lib/repositories/UserRepository";
import * as argon2 from "argon2";

export async function activateAccountAction(formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const tenantId = formData.get('tenantId') as string;

  if (!token || !password) {
    return { error: 'Faltan campos requeridos' };
  }

  try {
    // Find user by verificationToken
    const users = await userRepository.list({ verificationToken: token } as Record<string, unknown>);
    if (users.length === 0) {
      return { error: 'Token inválido o expirado' };
    }

    const user = users[0];

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Update user
    await userRepository.update(user._id!.toString(), {
      $set: {
        password: passwordHash,
        active: true,
        emailVerified: new Date(),
      },
      $unset: {
        verificationToken: ""
      }
    } as Record<string, unknown>);

    await logger.audit({
      tenantId: tenantId || 'unknown',
      action: 'USER_ACTIVATED',
      entityType: 'USER',
      entityId: user._id?.toString() || 'unknown',
      userId: user._id?.toString() || 'system',
      userEmail: user.email || 'system@abd.com',
      changedFields: { token },
    });

    return { success: true };
  } catch (error) {
    const activateErr = error instanceof Error ? error.message : 'Unknown error';
    await logger.audit({
      tenantId: tenantId || 'unknown',
      action: 'ACTIVATE_ACTION_ERROR',
      entityType: 'USER',
      entityId: token || 'unknown',
      userId: 'system',
      userEmail: 'system@abd.com',
      changedFields: { error: activateErr },
    });
    console.error("[ACTIVATE_ACTION_ERROR]", error);
    return { error: 'Ocurrió un error inesperado al activar la cuenta' };
  }
}

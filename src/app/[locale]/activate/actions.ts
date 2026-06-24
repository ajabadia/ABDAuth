/**
 * @purpose Gestiona el activado de una cuenta de usuario mediante la validación del token, cifrado de la contraseña y actualización del estado del usuario.
 * @purpose_en Handles the activation of a user account by validating the token, hashing the password, and updating the user's status.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:1nas0r1
 * @lastUpdated 2026-06-21T10:18:21.683Z
 */

'use server'

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

    return { success: true };
  } catch (error) {
    console.error("[ACTIVATE_ACTION_ERROR]", error);
    return { error: 'Ocurrió un error inesperado al activar la cuenta' };
  }
}

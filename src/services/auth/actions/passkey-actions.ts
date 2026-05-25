"use server";

import { headers } from 'next/headers';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { passkeyRepository } from '@/lib/repositories/PasskeyRepository';
import { challengeRepository } from '@/lib/repositories/ChallengeRepository';
import { userRepository } from '@/lib/repositories/UserRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { auth, unstable_update } from '@/auth';
import type { IndustrialUser } from '@/types/auth';
import type { EntityId } from '@/lib/schemas/common';

/**
 * Helper to get Relying Party ID and Origin dynamically
 */
async function getRpConfig() {
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3400';
  const rpID = host.split(':')[0];
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;
  return { rpID, origin };
}

/**
 * 🔒 WebAuthn: Generate registration options (options for navigator.credentials.create)
 */
export async function generatePasskeyRegistrationOptionsAction() {
  const session = await auth();
  const user = session?.user as IndustrialUser;
  if (!user) throw new Error("Unauthorized");

  const { rpID } = await getRpConfig();
  const userPasskeys = await passkeyRepository.findByUserId(user.id);

  const options = await generateRegistrationOptions({
    rpName: 'ABD Suite',
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
    userDisplayName: `${user.name} ${user.surname || ''}`.trim(),
    excludeCredentials: userPasskeys.map(p => ({
      id: p.credentialID,
      type: 'public-key',
    })),
    authenticatorSelection: {
      userVerification: 'preferred',
      residentKey: 'required', // Enables passwordless flow
    },
  });

  await challengeRepository.saveChallenge(options.challenge, user.id);
  return options;
}

/**
 * 🔓 WebAuthn: Verify registration response and persist Passkey
 */
export async function verifyPasskeyRegistrationAction(response: RegistrationResponseJSON) {
  const session = await auth();
  const user = session?.user as IndustrialUser;
  if (!user) return { success: false, error: "Unauthorized" };

  const { rpID, origin } = await getRpConfig();

  // Find user's pending registration challenge
  const challenges = await challengeRepository.list({ userId: user.id });
  if (challenges.length === 0) {
    return { success: false, error: "Challenge not found or expired" };
  }
  const expectedChallenge = challenges[0].challenge;

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      const { id, publicKey, counter, transports } = credential;

      const credIDString = id;
      const pubKeyString = Buffer.from(publicKey).toString('base64url');

      // Save passkey credential
      await passkeyRepository.create({
        userId: user.id,
        credentialID: credIDString,
        publicKey: pubKeyString,
        counter,
        transports,
        createdAt: new Date(),
      });

      await challengeRepository.deleteChallenge(expectedChallenge);

      // Activating MFA if WebAuthn is registered, as WebAuthn is an MFA factor
      const dbUser = await userRepository.findById(user.id);
      if (dbUser && !dbUser.mfaEnabled) {
        await userRepository.updateMfaStatus(user.id, true);
      }

      // Audit the registration
      await auditRepository.create({
        timestamp: new Date(),
        event: 'MFA_ENABLED',
        actorId: user.id,
        actorEmail: user.email,
        tenantId: user.tenantId || 'SYSTEM',
        status: 'SUCCESS',
        metadata: { method: 'WEBAUTHN' }
      });

      // Sync user session
      await unstable_update({
        user: {
          ...user,
          mfaEnabled: true,
          mfa_verified: true,
        }
      });

      return { success: true };
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[WebAuthn Registration Verification Failure]', err);
    return { success: false, error: err instanceof Error ? err.message : 'Verification failed' };
  }

  return { success: false, error: 'Verification failed' };
}

/**
 * 🔒 WebAuthn: Generate authentication options
 */
export async function generatePasskeyAuthenticationOptionsAction(email: string) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new Error("User not found");

  const { rpID } = await getRpConfig();
  const userPasskeys = await passkeyRepository.findByUserId(user._id?.toString() || '');
  if (userPasskeys.length === 0) {
    throw new Error("No passkeys registered for this user");
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: userPasskeys.map(p => ({
      id: p.credentialID,
      type: 'public-key',
      transports: p.transports as AuthenticatorTransportFuture[],
    })),
    userVerification: 'preferred',
  });

  await challengeRepository.saveChallenge(options.challenge, user._id?.toString());
  return options;
}

/**
 * 🔓 WebAuthn: Verify authentication response and return transient bypass login token
 */
export async function verifyPasskeyAuthenticationAction(email: string, response: AuthenticationResponseJSON) {
  const user = await userRepository.findByEmail(email);
  if (!user) return { success: false, error: "User not found" };

  const { rpID, origin } = await getRpConfig();

  const challenges = await challengeRepository.list({ userId: user._id?.toString() });
  if (challenges.length === 0) {
    return { success: false, error: "Challenge not found or expired" };
  }
  const expectedChallenge = challenges[0].challenge;

  const passkey = await passkeyRepository.findByCredentialId(response.id);
  if (!passkey) {
    return { success: false, error: "Passkey not found" };
  }

  try {
    const publicKeyBuffer = Buffer.from(passkey.publicKey, 'base64url');

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialID,
        publicKey: publicKeyBuffer,
        counter: passkey.counter,
      },
    });

    if (verification.verified && verification.authenticationInfo) {
      const { newCounter } = verification.authenticationInfo;

      await passkeyRepository.updateCounter(passkey.credentialID, newCounter);
      await challengeRepository.deleteChallenge(expectedChallenge);

      // Generate secure 30-second single-use bypass JWT token
      const { SignJWT } = await import('jose');
      const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET || 'secret');
      const bypassToken = await new SignJWT({ email: user.email, passkeyLogin: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('30s')
        .sign(secret);

      // Audit successful biometric verification
      await auditRepository.create({
        timestamp: new Date(),
        event: 'MFA_VERIFY_SUCCESS',
        actorId: user._id?.toString() || 'UNKNOWN',
        actorEmail: user.email,
        tenantId: user.tenantId,
        status: 'SUCCESS',
        metadata: { method: 'BIOMETRIC' }
      });

      return { success: true, bypassToken };
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[WebAuthn Authentication Verification Failure]', err);
    return { success: false, error: err instanceof Error ? err.message : 'Biometric verification failed' };
  }

  return { success: false, error: 'Verification failed' };
}

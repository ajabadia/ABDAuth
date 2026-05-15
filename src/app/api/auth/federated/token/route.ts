import { NextResponse } from 'next/server';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { federatedCodeRepository } from '@/lib/repositories/FederatedCodeRepository';
import { userRepository } from '@/lib/repositories/UserRepository';
import { tenantRepository } from '@/lib/repositories/TenantRepository';

/**
 * 🎫 Federated Token Endpoint
 * Exchanges Code for User Profile & Industrial Session
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, client_id, client_secret, redirect_uri } = body;

    if (!code || !client_id || !client_secret) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Validate Client
    const app = await applicationRepository.findByClientId(client_id);
    if (!app || app.clientSecret !== client_secret || !app.active) {
      return NextResponse.json({ error: 'Invalid client credentials' }, { status: 401 });
    }

    // 2. Validate Code
    const authCode = await federatedCodeRepository.findByCode(code);
    if (!authCode || authCode.clientId !== client_id || authCode.redirectUri !== redirect_uri) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    if (authCode.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 });
    }

    // 3. Mark code as used (Atomic Security)
    await federatedCodeRepository.markAsUsed(authCode._id);

    // 4. Fetch User Info
    const user = await userRepository.findOne({ _id: authCode.userId } as any);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tenant = await tenantRepository.findByTenantId(user.tenantId);

    // 5. Build Industrial Response (Compatible with ABDQuiz bridge)
    return NextResponse.json({
      access_token: 'at_' + authCode.code, // Placeholder for real JWT if needed later
      user: {
        id: user._id?.toString(),
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        tenantId: user.tenantId,
        dbPrefix: tenant?.dbPrefix || 'default',
        isolationStrategy: tenant?.isolationStrategy || 'COLLECTION_PREFIX',
      }
    });

  } catch (error) {
    console.error('FEDERATED_TOKEN_ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

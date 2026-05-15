import { NextResponse } from 'next/server';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { auth } from '@/auth';
import { ApplicationSchema } from '@/lib/schemas/auth';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * 🛰️ Applications API Handler
 * Manage federated satellite applications.
 */

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const applications = await applicationRepository.list();
    return NextResponse.json(applications);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Auto-generate credentials if not provided (Industrial Standard)
    if (!body.clientId) body.clientId = uuidv4();
    if (!body.clientSecret) body.clientSecret = crypto.randomBytes(32).toString('hex');
    
    const validated = ApplicationSchema.parse({
      ...body,
      createdAt: new Date(),
    });

    const id = await applicationRepository.create(validated);
    return NextResponse.json({ id, ...validated }, { status: 201 });
  } catch (error) {
    console.error('API_APPLICATION_POST_ERROR:', error);
    return NextResponse.json({ error: 'Validation failed or database error' }, { status: 400 });
  }
}

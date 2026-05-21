import { NextResponse } from 'next/server';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';

export async function GET() {
  try {
    const apps = await applicationRepository.list();
    return NextResponse.json({
      db: process.env.MONGODB_AUTH_DB,
      count: apps.length,
      clients: apps.map(a => ({ id: a.clientId, active: a.active, name: a.name }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Diagnostic failed', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}

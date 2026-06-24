/**
 * @purpose Gestiona la solicitud GET para obtener una lista de aplicaciones y sus detalles.
 * @purpose_en Handles the GET request to retrieve a list of applications and their details.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1bqp0oh
 * @lastUpdated 2026-06-21T10:16:46.704Z
 */

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

/**
 * @purpose Gestiona límites de velocidad para puntos finales sensibles en la aplicación ABDAuth.
 * @purpose_en Manages rate limiting for sensitive endpoints in the ABDAuth application.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1w6qton
 * @lastUpdated 2026-06-23T23:01:00.720Z
 */

import { rateLimitRepository } from '@/lib/repositories/RateLimitRepository';
import { headers } from 'next/headers';

/**
 * 🚦 ABDAuth Industrial Rate Limiter
 * Provides high-performance volumetric protection for sensitive endpoints.
 */
export class RateLimitService {
  /**
   * 🛡️ Check and increment rate limit for a specific key
   * @returns true if allowed, false if throttled
   */
  static async check(identifier: string, type: 'login' | 'recovery' | 'api', limit: number, windowSeconds: number): Promise<boolean> {
    const key = `${type}:${identifier}`;
    const points = await rateLimitRepository.increment(key, windowSeconds);
    return points <= limit;
  }

  /**
   * 🌐 Get Client IP from headers
   */
  static async getClientIp(): Promise<string> {
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    
    const realIp = headerList.get('x-real-ip');
    if (realIp) return realIp.trim();
    
    if (process.env.NODE_ENV === 'development') {
      return '127.0.0.1'; // Local dev is fine
    }
    
    // In production, if we can't find an IP, return a random UUID so we don't block all users
    // under a single '127.0.0.1' bucket. We should ideally log this anomaly.
    return `unknown-${crypto.randomUUID()}`;
  }
}

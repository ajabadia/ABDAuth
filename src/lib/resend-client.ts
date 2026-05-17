import { Resend } from 'resend';

let resendInstance: Resend | null = null;

/**
 * 🛰️ Resend Identity Client (Singleton)
 * Certified for industrial email orchestration.
 */
export function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      // eslint-disable-next-line no-console
      console.warn("RESEND_API_KEY is missing. Emails will not be sent.");
      throw new Error('RESEND_API_KEY is not defined in environment variables');
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

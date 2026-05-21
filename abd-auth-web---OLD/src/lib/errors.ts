/**
 * 🛡️ Industrial Application Error
 * Standardized for unified error handling across the ABD Ecosystem.
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly status: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    
    // Ensure the prototype is set correctly for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Type guard for AppError
 */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

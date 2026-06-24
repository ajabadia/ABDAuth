/**
 * @purpose Gestiona una clase de error estándar `AppError` para manejo unificado de errores en el ecosistema ABD y proporciona una función de guardia de tipo para verificar si un error es instancia de `AppError`.
 * @purpose_en Defines a standardized error class `AppError` for unified error handling across the ABD Ecosystem and provides a type guard function to check if an error is an instance of `AppError`.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:2,imports:0,sig:5deyzk
 * @lastUpdated 2026-06-23T22:41:12.398Z
 */

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

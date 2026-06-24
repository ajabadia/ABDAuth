/**
 * @purpose Proporciona una integración segura de clases Tailwind CSS utilizando `clsx` y `tailwind-merge`.
 * @purpose_en Provides a safe integration of Tailwind CSS classes using `clsx` and `tailwind-merge`.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:16q6yci
 * @lastUpdated 2026-06-23T22:43:57.046Z
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 🛠️ Utility for merging Tailwind classes safely.
 * Combines clsx for conditional class handling with tailwind-merge for conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

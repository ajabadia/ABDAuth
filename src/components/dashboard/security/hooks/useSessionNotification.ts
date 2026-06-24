'use client';

/**
 * @purpose Gestiona notificaciones de sesión con mensajes y tipos.
 * @purpose_en Manages session notifications with messages and types.
 * @refactorable false
 * @classification Custom Hook
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:ca2u5a
 * @lastUpdated 2026-06-21T12:04:05.578Z
 */

import { useState, useCallback } from 'react';

export function useSessionNotification() {
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  return { notification, notify };
}

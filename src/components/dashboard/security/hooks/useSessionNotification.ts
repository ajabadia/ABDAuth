'use client';

import { useState, useCallback } from 'react';

export function useSessionNotification() {
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  return { notification, notify };
}

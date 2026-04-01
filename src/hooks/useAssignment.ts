import { useState } from 'react';
import { useAuthFetch } from './useAuthFetch';
import type { AssignmentResult } from '../types';

const STORAGE_KEY = 'ubl-placement-confirmed';

/** Stub – no backend exists, so the API always returns nothing. */
export function useAssignment() {
  const authFetch = useAuthFetch();
  const [isConfirmed, setIsConfirmed] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; }
    catch { return false; }
  });

  async function confirmAssignment(): Promise<void> {
    try {
      const res = await authFetch('/api/assignment/confirm', { method: 'POST' });
      if (res.ok) {
        setIsConfirmed(true);
        try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
      }
    } catch {
      // Fallback to local state only
      setIsConfirmed(true);
      try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
    }
  }

  async function resetAssignment(): Promise<void> {
    try {
      const res = await authFetch('/api/assignment/reset', { method: 'POST' });
      if (res.ok) {
        setIsConfirmed(false);
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      }
    } catch {
      setIsConfirmed(false);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }

  return {
    assignment:        null as AssignmentResult | null,
    isLoading:         false,
    error:             null as unknown,
    isConfirmed,
    confirmAssignment,
    resetAssignment,
    mutate:            async () => {},
  };
}

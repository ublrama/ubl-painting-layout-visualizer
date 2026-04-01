import { useState } from 'react';
import type { AssignmentResult } from '../types';

const STORAGE_KEY = 'ubl-placement-confirmed';

/** Stub – no backend exists, so the API always returns nothing. */
export function useAssignment() {
  const [isConfirmed, setIsConfirmed] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; }
    catch { return false; }
  });

  async function confirmAssignment(): Promise<void> {
    setIsConfirmed(true);
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
  }

  async function resetAssignment(): Promise<void> {
    setIsConfirmed(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
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

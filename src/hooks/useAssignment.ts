import { useState, useEffect, useCallback } from 'react';
import { useAuthFetch } from './useAuthFetch';
import type { AssignmentResult } from '../types';

const STORAGE_KEY = 'ubl-placement-confirmed';

export function useAssignment() {
  const authFetch = useAuthFetch();
  const [assignment, setAssignment] = useState<AssignmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; }
    catch { return false; }
  });

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/assignment');
      if (res.ok) {
        const data = await res.json() as AssignmentResult;
        setAssignment(data);
        if (data.confirmedAt) {
          setIsConfirmed(true);
          try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
        }
      } else {
        setAssignment(null);
      }
    } catch (e) {
      setError(e);
      setAssignment(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void mutate();
  }, [mutate]);

  async function confirmAssignment(): Promise<void> {
    try {
      const res = await authFetch('/api/assignment/confirm', { method: 'POST' });
      if (res.ok) {
        const data = await res.json() as AssignmentResult;
        setAssignment(data);
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
        const data = await res.json() as AssignmentResult;
        setAssignment(data);
        setIsConfirmed(false);
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      }
    } catch {
      setIsConfirmed(false);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }

  return {
    assignment,
    isLoading,
    error,
    isConfirmed,
    confirmAssignment,
    resetAssignment,
    mutate,
  };
}

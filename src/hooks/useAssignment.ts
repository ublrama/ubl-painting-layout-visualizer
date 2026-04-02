import { useState, useEffect, useCallback } from 'react';
import { useAuthFetch } from './useAuthFetch';
import type { AssignmentResult } from '../types';

const STORAGE_KEY    = 'ubl-placement-confirmed';
const CACHE_KEY      = 'ubl-assignment-cache';
const CACHE_MAX_AGE  = 5 * 60 * 1000; // 5 minutes

function readCache(): AssignmentResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: AssignmentResult; ts: number };
    if (Date.now() - ts > CACHE_MAX_AGE) return null;
    return data;
  } catch { return null; }
}

function writeCache(data: AssignmentResult) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* ignore quota errors */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

export function useAssignment() {
  const authFetch = useAuthFetch();

  // Seed state from cache so the UI is populated immediately
  const [assignment, setAssignment] = useState<AssignmentResult | null>(() => readCache());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<unknown>(null);
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
        writeCache(data);
        if (data.confirmedAt) {
          setIsConfirmed(true);
          try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
        }
      } else {
        setAssignment(null);
      }
    } catch (e) {
      setError(e);
      // Keep showing cached data on network error
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
        writeCache(data);
        setIsConfirmed(true);
        try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
      }
    } catch {
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
        writeCache(data);
        setIsConfirmed(false);
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      }
    } catch {
      setIsConfirmed(false);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }

  // Call this after seeding/clearing so stale cache doesn't show old data
  function invalidateCache() {
    clearCache();
    void mutate();
  }

  return {
    assignment,
    isLoading,
    error,
    isConfirmed,
    confirmAssignment,
    resetAssignment,
    mutate,
    invalidateCache,
  };
}

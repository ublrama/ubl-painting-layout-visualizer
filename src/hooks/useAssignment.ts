import useSWR from 'swr';
import type { AssignmentResult } from '../types';

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : null));

export function useAssignment() {
  const { data, error, isLoading, mutate } = useSWR<AssignmentResult | null>(
    '/api/assignment',
    fetcher,
  );

  const isConfirmed = !!data?.confirmedAt;

  async function confirmAssignment() {
    const res = await fetch('/api/assignment/confirm', { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    await mutate();
    return res.json() as Promise<AssignmentResult>;
  }

  async function resetAssignment() {
    const res = await fetch('/api/assignment/reset', { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    await mutate();
    return res.json() as Promise<AssignmentResult>;
  }

  return {
    assignment: data ?? null,
    isLoading,
    error,
    isConfirmed,
    confirmAssignment,
    resetAssignment,
    mutate,
  };
}

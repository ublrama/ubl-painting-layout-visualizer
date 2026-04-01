import { useAuthFetch } from './useAuthFetch';
import type { Painting } from '../types';

export function usePaintingsMutations() {
  const authFetch = useAuthFetch();

  async function addPainting(data: Omit<Painting, 'id' | 'manuallyPlaced'>): Promise<Painting> {
    const res = await authFetch('/api/paintings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function updatePainting(id: string, data: Partial<Painting>): Promise<Painting> {
    const res = await authFetch(`/api/paintings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function deletePainting(id: string): Promise<{ freedSpace: { rackName: string; width: number; height: number } | null }> {
    const res = await authFetch(`/api/paintings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  return { addPainting, updatePainting, deletePainting };
}

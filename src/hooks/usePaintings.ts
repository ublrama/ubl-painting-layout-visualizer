import useSWR from 'swr';
import type { Painting } from '../types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UsePaintingsOptions {
  search?: string;
  collection?: string;
  assigned?: 'true' | 'false' | 'all';
  sort?: string;
  order?: 'asc' | 'desc';
}

export function usePaintings(options: UsePaintingsOptions = {}) {
  const params = new URLSearchParams();
  if (options.search)     params.set('search', options.search);
  if (options.collection) params.set('collection', options.collection);
  if (options.assigned)   params.set('assigned', options.assigned);
  if (options.sort)       params.set('sort', options.sort);
  if (options.order)      params.set('order', options.order);

  const query = params.toString();
  const key   = `/api/paintings${query ? `?${query}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<Painting[]>(key, fetcher);

  async function addPainting(painting: Omit<Painting, 'id' | 'manuallyPlaced'>) {
    const res = await fetch('/api/paintings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(painting),
    });
    if (!res.ok) throw new Error(await res.text());
    await mutate();
    return res.json() as Promise<Painting>;
  }

  async function updatePainting(id: string, updates: Partial<Painting>) {
    const res = await fetch(`/api/paintings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(await res.text());
    await mutate();
    return res.json() as Promise<Painting>;
  }

  async function deletePainting(id: string) {
    const res = await fetch(`/api/paintings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    await mutate();
    return data as { freedSpace: { rackName: string; width: number; height: number } | null };
  }

  return {
    paintings: data ?? [],
    isLoading,
    error,
    addPainting,
    updatePainting,
    deletePainting,
    mutate,
  };
}

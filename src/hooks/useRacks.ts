import useSWR from 'swr';
import type { Rack } from '../types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RackWithInfo extends Rack {
  paintingCount: number;
  usedArea: number;
  totalArea: number;
  availableArea: number;
}

export function useRacks() {
  const { data, error, isLoading, mutate } = useSWR<RackWithInfo[]>('/api/racks', fetcher);

  return {
    racks: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

import { useState, useEffect, useCallback } from 'react';
import type { Rack } from '../types';

interface RackWithInfo extends Rack {
  paintingCount: number;
  usedArea: number;
  totalArea: number;
  availableArea: number;
}

export function useRacks() {
  const [data, setData] = useState<RackWithInfo[] | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mutate = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await fetch('/api/racks');
      const d = (await r.json()) as RackWithInfo[];
      setData(d);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void mutate();
  }, [mutate]);

  return {
    racks: data ?? ([] as RackWithInfo[]),
    isLoading,
    error,
    mutate,
  };
}

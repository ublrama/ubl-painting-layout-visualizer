import { useState, useEffect } from 'react';
import type { RackSuggestion, ForcePlacementResult } from '../types';

interface AutoSuggestParams {
  width: number;
  height: number;
  depth: number;
}

interface ForcePlaceParams {
  paintingId: string;
  targetRack: string;
}

export function useRackSuggestions(params: AutoSuggestParams | ForcePlaceParams | null) {
  const [data,      setData]      = useState<RackSuggestion[] | ForcePlacementResult | undefined>(undefined);
  const [error,     setError]     = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);

  let key: string | null = null;
  if (params) {
    const p = new URLSearchParams();
    if ('paintingId' in params) {
      p.set('paintingId', params.paintingId);
      p.set('targetRack', params.targetRack);
    } else {
      p.set('width',  String(params.width));
      p.set('height', String(params.height));
      p.set('depth',  String(params.depth));
    }
    key = `/api/suggest-rack?${p.toString()}`;
  }

  useEffect(() => {
    if (!key) { setData(undefined); return; }
    setIsLoading(true);
    fetch(key)
      .then((r) => r.json() as Promise<RackSuggestion[] | ForcePlacementResult>)
      .then((d) => { setData(d); setIsLoading(false); })
      .catch((e) => { setError(e); setIsLoading(false); });
  }, [key]);

  return { suggestions: data, isLoading, error };
}

import useSWR from 'swr';
import type { RackSuggestion, ForcePlacementResult } from '../types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

  const { data, error, isLoading } = useSWR<RackSuggestion[] | ForcePlacementResult>(
    key,
    fetcher,
  );

  return { suggestions: data, isLoading, error };
}

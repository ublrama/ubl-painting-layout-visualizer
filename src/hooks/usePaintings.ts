import { useMemo } from 'react';
import type { AssignmentResult, Painting } from '../types';

interface UsePaintingsOptions {
  assignmentResult: AssignmentResult | null;
  search?: string;
  collection?: string;
  assigned?: 'true' | 'false' | 'all';
  sort?: 'signatuur' | 'width' | 'height' | 'depth' | 'collection';
  order?: 'asc' | 'desc';
}

export function usePaintings(options: UsePaintingsOptions) {
  const {
    assignmentResult,
    search,
    collection,
    assigned,
    sort = 'signatuur',
    order = 'asc',
  } = options;

  const paintings = useMemo<Painting[]>(() => {
    if (!assignmentResult) return [];

    // Collect all paintings with the correct assignedRackName
    const placed: Painting[] = assignmentResult.racks.flatMap((r) =>
      r.paintings.map((p) => ({ ...p, assignedRackName: r.name })),
    );
    const unassigned: Painting[] = assignmentResult.unassigned.map((p) => ({
      ...p,
      assignedRackName: null,
    }));

    let all = [...placed, ...unassigned];

    // Filter: search
    if (search) {
      const q = search.toLowerCase();
      all = all.filter(
        (p) =>
          p.signatuur.toLowerCase().includes(q) ||
          p.collection.toLowerCase().includes(q),
      );
    }

    // Filter: collection
    if (collection) {
      all = all.filter((p) => p.collection === collection);
    }

    // Filter: assigned status
    if (assigned === 'true')  all = all.filter((p) => p.assignedRackName !== null);
    if (assigned === 'false') all = all.filter((p) => p.assignedRackName === null);

    // Sort
    all = [...all].sort((a, b) => {
      let cmp = 0;
      if (sort === 'signatuur' || sort === 'collection') {
        cmp = a[sort].localeCompare(b[sort]);
      } else {
        cmp = (a[sort] as number) - (b[sort] as number);
      }
      return order === 'asc' ? cmp : -cmp;
    });

    return all;
  }, [assignmentResult, search, collection, assigned, sort, order]);

  return { paintings, isLoading: false };
}

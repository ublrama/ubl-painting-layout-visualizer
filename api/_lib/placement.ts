/**
 * Shared placement algorithm used by both API routes and frontend.
 * Duplicated here since API routes can't import from src/ in Vercel's build.
 *
 * MAINTENANCE: Keep this file in sync with src/utils/assignPaintingsToRacks.ts.
 * Any changes to the placement logic must be applied to both files.
 */

import type { Painting, Rack, PlacedPainting, AssignmentResult } from '../../src/types';

export const PADDING = 5;

interface ShelfState {
  currentX: number;
  currentY: number;
  shelfHeight: number;
  paintings: PlacedPainting[];
}

/**
 * Try to place a painting onto the given shelf state within the given rack dimensions.
 * Mutates shelfState on success; returns true if placed, false otherwise.
 */
export function tryPlace(
  painting: Painting,
  shelfState: ShelfState,
  rackWidth: number,
  rackHeight: number,
): boolean {
  // Try current shelf first
  if (
    shelfState.currentX + painting.width + PADDING <= rackWidth &&
    shelfState.currentY + painting.height + PADDING <= rackHeight
  ) {
    shelfState.paintings.push({ ...painting, x: shelfState.currentX, y: shelfState.currentY });
    shelfState.currentX += painting.width + PADDING;
    if (painting.height + PADDING > shelfState.shelfHeight) {
      shelfState.shelfHeight = painting.height + PADDING;
    }
    return true;
  }

  // Try a new shelf
  const nextShelfY = shelfState.currentY + shelfState.shelfHeight;
  if (
    nextShelfY + painting.height + PADDING <= rackHeight &&
    PADDING + painting.width + PADDING <= rackWidth
  ) {
    shelfState.currentX = PADDING;
    shelfState.currentY = nextShelfY;
    shelfState.shelfHeight = painting.height + PADDING;
    shelfState.paintings.push({ ...painting, x: shelfState.currentX, y: shelfState.currentY });
    shelfState.currentX += painting.width + PADDING;
    return true;
  }

  return false;
}

/**
 * Build a ShelfState from an existing list of already-placed paintings,
 * so we can continue packing on that side.
 */
export function buildShelfState(placed: PlacedPainting[]): ShelfState {
  if (placed.length === 0) {
    return { currentX: PADDING, currentY: PADDING, shelfHeight: 0, paintings: placed };
  }

  const maxY = Math.max(...placed.map((p) => p.y));
  const paintingsOnLastShelf = placed.filter((p) => p.y === maxY);
  const rightmost = paintingsOnLastShelf.reduce(
    (best, p) => (p.x + p.width > best ? p.x + p.width : best),
    0,
  );
  const shelfHeight = Math.max(...paintingsOnLastShelf.map((p) => p.height + PADDING));

  return {
    currentX: rightmost + PADDING,
    currentY: maxY,
    shelfHeight,
    paintings: placed,
  };
}

const PRIORITY_RACKS = new Set<string>([
  'Pos. 2-11a',
  'Pos. 4-12a',
  'Pos. 4-11b',
  'Pos. 1-12a',
  'Pos. 1-12b',
  'Pos. 1-13a',
  'Pos. 1-13b',
  'Pos. 1-14a',
  'Pos. 1-14b',
  'Pos. 1-15a',
  'Pos. 1-15b',
  'Pos. 1-16a',
  'Pos. 1-16b',
  'Pos. 1-17a',
  'Pos. 1-17b',
  'Pos. 1-18a',
  'Pos. 1-18b',
  'Pos. 1-19a',
  'Pos. 1-19b',
  'Pos. 1-20a',
  'Pos. 1-20b',
  'Pos. 1-21a',
  'Pos. 1-21b',
  'Pos. 3-22a',
]);

const isPriorityRack = (name: string) => PRIORITY_RACKS.has(name);

export function assignPaintingsToRacks(paintings: Painting[], racks: Rack[]): AssignmentResult {
  const workRacks: Rack[] = racks.map((r) => ({
    ...r,
    paintings: [],
  }));

  const sorted = [...paintings].sort((a, b) => a.depth - b.depth);
  const unassigned: Painting[] = [];

  for (const painting of sorted) {
    const byDepth = (a: Rack, b: Rack) => a.rackType.maxDepth - b.rackType.maxDepth;
    const canFit  = (r: Rack) => r.rackType.maxDepth >= painting.depth;

    const priorityEligible  = workRacks.filter((r) =>  isPriorityRack(r.name) && canFit(r)).sort(byDepth);
    const remainingEligible = workRacks.filter((r) => !isPriorityRack(r.name) && canFit(r)).sort(byDepth);
    const eligible = [...priorityEligible, ...remainingEligible];

    let placed = false;
    for (const rack of eligible) {
      const { width: rw, height: rh } = rack.rackType;
      const state = buildShelfState(rack.paintings);
      if (tryPlace(painting, state, rw, rh)) {
        rack.paintings = state.paintings;
        placed = true;
        break;
      }
    }

    if (!placed) {
      unassigned.push(painting);
    }
  }

  return { racks: workRacks, unassigned, confirmedAt: null };
}

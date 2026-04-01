import { PADDING } from '../constants';
import type { Painting, Rack, PlacedPainting, AssignmentResult } from '../types';

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
function tryPlace(
  painting: Painting,
  shelfState: ShelfState,
  rackWidth: number,
  rackHeight: number,
): boolean {
  // Try current shelf first — must fit both horizontally and vertically within the rack
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
function buildShelfState(placed: PlacedPainting[]): ShelfState {
  if (placed.length === 0) {
    return { currentX: PADDING, currentY: PADDING, shelfHeight: 0, paintings: placed };
  }

  // Reconstruct the shelf state from the existing placements
  // Find the bottom-most y and then the rightmost x on that shelf
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

/**
 * Explicit list of priority racks.
 * These are filled first (best-fit depth within the group).
 * All other racks are only used once these are full.
 */
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

/**
 * Assign paintings to racks using a two-phase strategy:
 *
 * Phase 1 – Predefined racks (CSV "Rek" column):
 *   Paintings that carry a predefinedRack name are placed directly onto that
 *   rack first, regardless of depth/priority ordering.  If the rack doesn't
 *   exist or the painting physically doesn't fit, it falls through to unassigned.
 *
 * Phase 2 – Normal best-fit:
 *   Remaining paintings are sorted by depth ascending and distributed using
 *   the priority-first / best-fit-depth shelf algorithm.
 */
export function assignPaintingsToRacks(paintings: Painting[], racks: Rack[]): AssignmentResult {
  // Deep-copy racks so we don't mutate the originals
  const workRacks: Rack[] = racks.map((r) => ({
    ...r,
    paintings: [],
  }));

  const rackByName = new Map<string, Rack>(workRacks.map((r) => [r.name, r]));

  const unassigned: Painting[] = [];

  // ── Phase 1: paintings with a predefined rack ──────────────────────────────
  const predefined = paintings.filter((p) => p.predefinedRack !== null);
  const free       = paintings.filter((p) => p.predefinedRack === null);

  for (const painting of predefined) {
    const targetRack = rackByName.get(painting.predefinedRack!);
    if (!targetRack) {
      unassigned.push(painting);
      continue;
    }
    const { width: rw, height: rh } = targetRack.rackType;
    const state = buildShelfState(targetRack.paintings);
    if (tryPlace(painting, state, rw, rh)) {
      targetRack.paintings = state.paintings;
    } else {
      unassigned.push(painting);
    }
  }

  // ── Phase 2: remaining paintings – priority-first, best-fit depth ──────────
  const sorted = [...free].sort((a, b) => a.depth - b.depth);

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

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
 * Assign paintings to racks using a best-fit depth strategy and shelf bin-packing.
 *
 * Algorithm:
 * 1. Sort paintings by depth ascending (shallowest first).
 * 2. For each painting, find eligible racks (maxDepth >= painting.depth),
 *    sorted by maxDepth ascending (prefer smallest viable maxDepth).
 * 3. Try to place on front first, then back of each eligible rack.
 * 4. If nowhere fits, add to unassigned.
 */
export function assignPaintingsToRacks(paintings: Painting[], racks: Rack[]): AssignmentResult {
  // Deep-copy racks so we don't mutate the originals
  const workRacks: Rack[] = racks.map((r) => ({
    ...r,
    frontPaintings: [],
    backPaintings: [],
  }));

  // Sort paintings by depth ascending
  const sorted = [...paintings].sort((a, b) => a.depth - b.depth);

  const unassigned: Painting[] = [];

  for (const painting of sorted) {
    // Find eligible racks sorted by maxDepth ascending
    const eligible = workRacks
      .filter((r) => r.rackType.maxDepth >= painting.depth)
      .sort((a, b) => a.rackType.maxDepth - b.rackType.maxDepth);

    let placed = false;
    for (const rack of eligible) {
      const { width: rw, height: rh } = rack.rackType;

      // Try front
      const frontState = buildShelfState(rack.frontPaintings);
      if (tryPlace(painting, frontState, rw, rh)) {
        rack.frontPaintings = frontState.paintings;
        placed = true;
        break;
      }

      // Try back
      const backState = buildShelfState(rack.backPaintings);
      if (tryPlace(painting, backState, rw, rh)) {
        rack.backPaintings = backState.paintings;
        placed = true;
        break;
      }
    }

    if (!placed) {
      unassigned.push(painting);
    }
  }

  return { racks: workRacks, unassigned };
}

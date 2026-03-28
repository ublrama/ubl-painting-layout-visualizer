import { WALL_WIDTH, WALL_HEIGHT, PADDING } from '../constants';
import type { Painting, PlacedPainting, Wall } from '../types';

/**
 * Shelf bin-packing algorithm.
 *
 * Sorts paintings by height descending, then places them onto shelves
 * within walls of WALL_WIDTH × WALL_HEIGHT (cm).
 * Each painting gets PADDING cm on all four sides.
 *
 * @param paintings - Input paintings with signatuur + dimensions
 * @returns Array of Wall objects, each containing placed paintings with (x, y) positions
 */
export function packPaintings(paintings: Painting[]): Wall[] {
  // Sort by height descending (tallest first)
  const sorted = [...paintings].sort((a, b) => b.height - a.height);

  const walls: Wall[] = [];
  let currentPaintings: PlacedPainting[] = [];
  let currentX = PADDING;
  let currentY = PADDING;
  let shelfHeight = 0;

  for (const painting of sorted) {
    const pw = painting.width + PADDING * 2;   // effective width
    const ph = painting.height + PADDING * 2;  // effective height

    if (currentX + painting.width + PADDING <= WALL_WIDTH) {
      // Fits on the current shelf
      currentPaintings.push({ ...painting, x: currentX, y: currentY });
      currentX += pw;
      if (ph > shelfHeight) shelfHeight = ph;
    } else {
      // Try a new shelf on the current wall
      const nextShelfY = currentY + shelfHeight;
      if (nextShelfY + painting.height + PADDING <= WALL_HEIGHT) {
        // New shelf fits on current wall
        currentX = PADDING;
        currentY = nextShelfY;
        shelfHeight = ph;
        currentPaintings.push({ ...painting, x: currentX, y: currentY });
        currentX += pw;
      } else {
        // Need a new wall
        walls.push({ index: walls.length, paintings: currentPaintings });
        currentPaintings = [];
        currentX = PADDING;
        currentY = PADDING;
        shelfHeight = ph;
        currentPaintings.push({ ...painting, x: currentX, y: currentY });
        currentX += pw;
      }
    }
  }

  if (currentPaintings.length > 0) {
    walls.push({ index: walls.length, paintings: currentPaintings });
  }

  return walls;
}

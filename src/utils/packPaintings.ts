import { WALL_WIDTH, WALL_HEIGHT, PADDING } from '../constants';
import { Painting, PlacedPainting, Wall } from '../types';

/**
 * Shelf bin-packing algorithm.
 * Sorts paintings by height descending, then places them on shelves within walls.
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
    const pw = painting.width + PADDING * 2;
    const ph = painting.height + PADDING * 2;

    if (currentX + painting.width + PADDING <= WALL_WIDTH) {
      // Fits on current shelf
      currentPaintings.push({ ...painting, x: currentX, y: currentY });
      currentX += pw;
      if (ph > shelfHeight) shelfHeight = ph;
    } else {
      const nextShelfY = currentY + shelfHeight;
      if (nextShelfY + painting.height + PADDING <= WALL_HEIGHT) {
        // New shelf on current wall
        currentX = PADDING;
        currentY = nextShelfY;
        shelfHeight = ph;
        currentPaintings.push({ ...painting, x: currentX, y: currentY });
        currentX += pw;
      } else {
        // New wall
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

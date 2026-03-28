import { WALL_WIDTH, WALL_HEIGHT, PADDING } from '../constants.js';

/**
 * Shelf bin-packing algorithm.
 *
 * Sorts paintings by height descending, then places them onto shelves
 * within walls of WALL_WIDTH × WALL_HEIGHT (cm).
 * Each painting gets PADDING cm on all four sides.
 *
 * @param {Array<{signatuur: string, width: number, height: number}>} paintings
 * @returns {Array<Array<{signatuur: string, width: number, height: number, x: number, y: number}>>}
 *   Array of walls, each wall is an array of placed painting objects with top-left (x, y) in cm.
 */
export function packPaintings(paintings) {
  // Sort by height descending (tallest first)
  const sorted = [...paintings].sort((a, b) => b.height - a.height);

  const walls = [];
  let currentWall = [];
  let currentX = PADDING;
  let currentY = PADDING;
  let shelfHeight = 0; // tallest painting on current shelf (including bottom padding)

  for (const painting of sorted) {
    const pw = painting.width + PADDING * 2;  // effective width  (painting + left + right pad)
    const ph = painting.height + PADDING * 2; // effective height (painting + top + bottom pad)

    // Check if painting fits on the current shelf
    if (currentX + painting.width + PADDING <= WALL_WIDTH) {
      // Fits on current shelf
      currentWall.push({
        ...painting,
        x: currentX,
        y: currentY,
      });
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
        currentWall.push({
          ...painting,
          x: currentX,
          y: currentY,
        });
        currentX += pw;
      } else {
        // Need a new wall
        walls.push(currentWall);
        currentWall = [];
        currentX = PADDING;
        currentY = PADDING;
        shelfHeight = ph;
        currentWall.push({
          ...painting,
          x: currentX,
          y: currentY,
        });
        currentX += pw;
      }
    }
  }

  // Push the last wall if it has paintings
  if (currentWall.length > 0) {
    walls.push(currentWall);
  }

  return walls;
}

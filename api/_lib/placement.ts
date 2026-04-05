/**
 * Maximal Rectangles bin-packing algorithm — API copy.
 *
 * MAINTENANCE: Keep in sync with src/utils/assignPaintingsToRacks.ts.
 * Duplicated here because Vercel serverless functions cannot import from src/.
 *
 * See the frontend file for full algorithm documentation.
 */

import type { Painting, Rack, PlacedPainting, AssignmentResult } from '../../src/types';

export const MARGIN = 2; // cm

// ── Types ──────────────────────────────────────────────────────────────────────

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PackState {
  freeRects: FreeRect[];
  paintings: PlacedPainting[];
}

// ── Core functions ─────────────────────────────────────────────────────────────

export function createPackState(rackWidth: number, rackHeight: number): PackState {
  return {
    freeRects: [{ x: MARGIN, y: MARGIN, w: rackWidth - MARGIN, h: rackHeight - MARGIN }],
    paintings: [],
  };
}

export function buildPackState(
  placed: PlacedPainting[],
  rackWidth: number,
  rackHeight: number,
): PackState {
  const state = createPackState(rackWidth, rackHeight);
  state.paintings = [...placed];
  for (const p of placed) {
    _subtractRect(state.freeRects, p.x, p.y, p.width + MARGIN, p.height + MARGIN);
  }
  return state;
}

export function tryPlace(painting: Painting, state: PackState): boolean {
  const pw = painting.width  + MARGIN;
  const ph = painting.height + MARGIN;

  let bestIdx       = -1;
  let bestShortSide = Infinity;
  let bestLongSide  = Infinity;

  for (let i = 0; i < state.freeRects.length; i++) {
    const r = state.freeRects[i];
    if (pw <= r.w && ph <= r.h) {
      const shortSide = Math.min(r.w - pw, r.h - ph);
      const longSide  = Math.max(r.w - pw, r.h - ph);
      if (shortSide < bestShortSide || (shortSide === bestShortSide && longSide < bestLongSide)) {
        bestShortSide = shortSide;
        bestLongSide  = longSide;
        bestIdx       = i;
      }
    }
  }

  if (bestIdx === -1) return false;

  const rect = state.freeRects[bestIdx];
  state.paintings.push({ ...painting, x: rect.x, y: rect.y });
  _subtractRect(state.freeRects, rect.x, rect.y, pw, ph);
  return true;
}

// ── Internal ───────────────────────────────────────────────────────────────────

function _subtractRect(
  freeRects: FreeRect[],
  usedX: number,
  usedY: number,
  usedW: number,
  usedH: number,
): void {
  const result: FreeRect[] = [];

  for (const r of freeRects) {
    if (
      usedX >= r.x + r.w || usedX + usedW <= r.x ||
      usedY >= r.y + r.h || usedY + usedH <= r.y
    ) {
      result.push(r);
      continue;
    }
    if (usedX > r.x)
      result.push({ x: r.x,           y: r.y,           w: usedX - r.x,                   h: r.h });
    if (usedX + usedW < r.x + r.w)
      result.push({ x: usedX + usedW, y: r.y,           w: r.x + r.w - (usedX + usedW),   h: r.h });
    if (usedY > r.y)
      result.push({ x: r.x,           y: r.y,           w: r.w, h: usedY - r.y             });
    if (usedY + usedH < r.y + r.h)
      result.push({ x: r.x,           y: usedY + usedH, w: r.w, h: r.y + r.h - (usedY + usedH) });
  }

  const pruned = result.filter((a, i) =>
    !result.some(
      (b, j) => i !== j && b.x <= a.x && b.y <= a.y && b.x + b.w >= a.x + a.w && b.y + b.h >= a.y + a.h,
    ),
  );

  freeRects.length = 0;
  for (const r of pruned) freeRects.push(r);
}

// ── Cross-rack placement helper ───────────────────────────────────────────────

function _findBestRack(
  painting: Painting,
  racks: Rack[],
  states: Map<string, PackState>,
): Rack | null {
  const pw = painting.width  + MARGIN;
  const ph = painting.height + MARGIN;

  let bestRack:  Rack | null = null;
  let bestDepth  = Infinity;
  let bestShort  = Infinity;
  let bestLong   = Infinity;

  for (const rack of racks) {
    const depth = rack.rackType.maxDepth;
    if (depth > bestDepth) continue;

    for (const r of states.get(rack.name)!.freeRects) {
      if (pw <= r.w && ph <= r.h) {
        const shortSide = Math.min(r.w - pw, r.h - ph);
        const longSide  = Math.max(r.w - pw, r.h - ph);
        if (
          depth < bestDepth ||
          (depth === bestDepth &&
            (shortSide < bestShort || (shortSide === bestShort && longSide < bestLong)))
        ) {
          bestDepth = depth;
          bestShort = shortSide;
          bestLong  = longSide;
          bestRack  = rack;
        }
      }
    }
  }

  return bestRack;
}

// ── Priority racks ─────────────────────────────────────────────────────────────

const PRIORITY_RACKS = new Set<string>([
  'Pos. 2-11a', 'Pos. 4-12a', 'Pos. 4-11b',
  'Pos. 1-12a', 'Pos. 1-12b', 'Pos. 1-13a', 'Pos. 1-13b',
  'Pos. 1-14a', 'Pos. 1-14b', 'Pos. 1-15a', 'Pos. 1-15b',
  'Pos. 1-16a', 'Pos. 1-16b', 'Pos. 1-17a', 'Pos. 1-17b',
  'Pos. 1-18a', 'Pos. 1-18b', 'Pos. 1-19a', 'Pos. 1-19b',
  'Pos. 1-20a', 'Pos. 1-20b', 'Pos. 1-21a', 'Pos. 1-21b',
  'Pos. 3-22a',
]);

const isPriorityRack = (name: string) => PRIORITY_RACKS.has(name);

// ── Main export ────────────────────────────────────────────────────────────────

export function assignPaintingsToRacks(paintings: Painting[], racks: Rack[]): AssignmentResult {
  const workRacks: Rack[] = racks.map((r) => ({ ...r, paintings: [] }));
  const rackByName = new Map<string, Rack>(workRacks.map((r) => [r.name, r]));

  const rackStates = new Map<string, PackState>(
    workRacks.map((r) => [r.name, createPackState(r.rackType.width, r.rackType.height)]),
  );

  const unassigned: Painting[] = [];

  const predefined = paintings.filter((p) => p.predefinedRack !== null);
  const free       = paintings.filter((p) => p.predefinedRack === null);

  for (const painting of predefined) {
    const rack = rackByName.get(painting.predefinedRack!);
    if (!rack) { unassigned.push(painting); continue; }
    const state = rackStates.get(rack.name)!;
    if (tryPlace(painting, state)) {
      rack.paintings = state.paintings;
    } else {
      unassigned.push(painting);
    }
  }

  const sorted = [...free].sort((a, b) => b.width * b.height - a.width * a.height);

  for (const painting of sorted) {
    const canFit  = (r: Rack) => r.rackType.maxDepth >= painting.depth;
    const byDepth = (a: Rack, b: Rack) => a.rackType.maxDepth - b.rackType.maxDepth;

    const priorityEligible  = workRacks.filter((r) =>  isPriorityRack(r.name) && canFit(r)).sort(byDepth);
    const remainingEligible = workRacks.filter((r) => !isPriorityRack(r.name) && canFit(r)).sort(byDepth);

    const targetRack =
      _findBestRack(painting, priorityEligible,  rackStates) ??
      _findBestRack(painting, remainingEligible, rackStates);

    if (targetRack) {
      const state = rackStates.get(targetRack.name)!;
      tryPlace(painting, state);
      targetRack.paintings = state.paintings;
    } else {
      unassigned.push(painting);
    }
  }

  return { racks: workRacks, unassigned, confirmedAt: null };
}

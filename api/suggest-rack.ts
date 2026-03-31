/**
 * GET /api/suggest-rack
 *
 * Mode 1 (auto-suggest):  ?width=&height=&depth=
 *   Returns ranked RackSuggestion[] sorted by canFit first, then fewest paintings.
 *
 * Mode 2 (force-place):   ?paintingId=&targetRack=
 *   Returns ForcePlacementResult with move suggestions to free space.
 */

import type { Painting, PlacedPainting, RackSuggestion, ForcePlacementResult, MoveSuggestion } from '../src/types';
import { getAssignment, getPaintings } from './_lib/store';
import { buildShelfState, tryPlace, PADDING } from './_lib/placement';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
  }

  const url        = new URL(req.url);
  const paintingId = url.searchParams.get('paintingId');
  const targetRack = url.searchParams.get('targetRack');

  const assignment = await getAssignment();
  if (!assignment) {
    return Response.json({ error: 'No assignment found' }, { status: 404, headers: CORS_HEADERS });
  }

  // ── Mode 2: force-place ──────────────────────────────────────────────────
  if (paintingId && targetRack) {
    const paintings = await getPaintings();
    const painting  = paintings.find((p) => p.id === paintingId);
    if (!painting) {
      return Response.json({ error: 'Painting not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const rack = assignment.racks.find((r) => r.name === targetRack);
    if (!rack) {
      return Response.json({ error: 'Rack not found' }, { status: 404, headers: CORS_HEADERS });
    }

    // Try placing directly
    const directState = buildShelfState([...(rack.paintings as PlacedPainting[])]);
    const canPlaceDirectly = tryPlace(painting, directState, rack.rackType.width, rack.rackType.height);

    if (canPlaceDirectly) {
      const result: ForcePlacementResult = { canPlaceDirectly: true, moveSuggestions: [] };
      return Response.json(result, { headers: CORS_HEADERS });
    }

    // Suggest moving paintings to make room
    const moveSuggestions: MoveSuggestion[] = [];

    for (const rackPainting of rack.paintings) {
      // Try placing the target painting assuming this one is removed
      const remaining = rack.paintings.filter((p) => p.id !== rackPainting.id) as Painting[];
      const testState = buildShelfState([]);
      testState.currentX = PADDING;
      testState.currentY = PADDING;
      const tempRackPaintings: PlacedPainting[] = [];
      const testShelf = { currentX: PADDING, currentY: PADDING, shelfHeight: 0, paintings: tempRackPaintings };
      for (const p of remaining) {
        tryPlace(p, testShelf, rack.rackType.width, rack.rackType.height);
      }
      const fitsAfterRemoval = tryPlace(painting, testShelf, rack.rackType.width, rack.rackType.height);

      if (fitsAfterRemoval) {
        // Find an alternative rack for rackPainting
        let suggestedRackName = '';
        let canFit = false;
        for (const altRack of assignment.racks) {
          if (altRack.name === targetRack) continue;
          if (altRack.rackType.maxDepth < rackPainting.depth) continue;
          const altState = buildShelfState([...(altRack.paintings as PlacedPainting[])]);
          if (tryPlace(rackPainting, altState, altRack.rackType.width, altRack.rackType.height)) {
            suggestedRackName = altRack.name;
            canFit = true;
            break;
          }
        }
        moveSuggestions.push({
          painting: rackPainting as PlacedPainting,
          suggestedRack: suggestedRackName || 'Geen rek gevonden',
          canFit,
        });
      }

      if (moveSuggestions.length >= 3) break;
    }

    const result: ForcePlacementResult = { canPlaceDirectly: false, moveSuggestions };
    return Response.json(result, { headers: CORS_HEADERS });
  }

  // ── Mode 1: auto-suggest ─────────────────────────────────────────────────
  const width  = parseFloat(url.searchParams.get('width')  ?? '');
  const height = parseFloat(url.searchParams.get('height') ?? '');
  const depth  = parseFloat(url.searchParams.get('depth')  ?? '');

  if (isNaN(width) || isNaN(height) || isNaN(depth)) {
    return Response.json({ error: 'Provide width, height, depth OR paintingId + targetRack' }, { status: 400, headers: CORS_HEADERS });
  }

  const mockPainting: Painting = {
    id: 'mock',
    signatuur: 'mock',
    collection: 'Unknown',
    width, height, depth,
    assignedRackName: null,
    manuallyPlaced: false,
  };

  const suggestions: RackSuggestion[] = [];

  for (const rack of assignment.racks) {
    if (rack.rackType.maxDepth < depth) continue;

    const totalArea   = rack.rackType.width * rack.rackType.height;
    const usedArea    = rack.paintings.reduce((s, p) => s + p.width * p.height, 0);
    const testState   = buildShelfState([...(rack.paintings as PlacedPainting[])]);
    const canFit      = tryPlace(mockPainting, testState, rack.rackType.width, rack.rackType.height);

    suggestions.push({
      rackName:       rack.name,
      rackType:       rack.rackType,
      paintingCount:  rack.paintings.length,
      canFit,
      remainingArea:  totalArea - usedArea,
    });
  }

  // Sort: canFit first, then by fewest paintings
  suggestions.sort((a, b) => {
    if (a.canFit !== b.canFit) return a.canFit ? -1 : 1;
    return a.paintingCount - b.paintingCount;
  });

  return Response.json(suggestions, { headers: CORS_HEADERS });
}

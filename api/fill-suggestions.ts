/**
 * GET /api/fill-suggestions
 * Query params: ?rackName=&removedPaintingWidth=&removedPaintingHeight=
 *
 * Returns up to 5 unassigned paintings that could fill the freed space,
 * sorted by best fit (closest in size).
 */

import type { FillSuggestion } from '../src/types';
import { getAssignment, getPaintings } from './_lib/store';

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

  const url        = new URL(req.url, 'http://localhost');
  const rackName   = url.searchParams.get('rackName') ?? '';
  const freeWidth  = parseFloat(url.searchParams.get('removedPaintingWidth')  ?? '');
  const freeHeight = parseFloat(url.searchParams.get('removedPaintingHeight') ?? '');

  if (!rackName || isNaN(freeWidth) || isNaN(freeHeight)) {
    return Response.json(
      { error: 'Provide rackName, removedPaintingWidth and removedPaintingHeight' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const [paintings, assignment] = await Promise.all([getPaintings(), getAssignment()]);

  // Get max depth for the rack
  let maxDepth = Infinity;
  if (assignment) {
    const rack = assignment.racks.find((r) => r.name === rackName);
    if (rack) maxDepth = rack.rackType.maxDepth;
  }

  // Unassigned paintings that fit within the freed area
  const unassigned = paintings.filter((p) => p.assignedRackName === null && p.depth <= maxDepth);

  const suggestions: FillSuggestion[] = unassigned
    .map((painting) => ({
      painting,
      fitsWidth:  freeWidth  - painting.width,
      fitsHeight: freeHeight - painting.height,
    }))
    .filter((s) => s.fitsWidth >= 0 && s.fitsHeight >= 0)
    .sort((a, b) => {
      // Best fit = smallest remaining space
      const remainA = a.fitsWidth * a.fitsHeight;
      const remainB = b.fitsWidth * b.fitsHeight;
      return remainA - remainB;
    })
    .slice(0, 5);

  return Response.json(suggestions, { headers: CORS_HEADERS });
}

/**
 * GET    /api/paintings/[id]  — get single painting
 * PUT    /api/paintings/[id]  — update painting
 * DELETE /api/paintings/[id]  — delete painting
 */

import type { Painting, PlacedPainting } from '../../src/types';
import { getPaintings, setPaintings, getAssignment, setAssignment } from '../_lib/store';
import { buildShelfState, tryPlace, assignPaintingsToRacks } from '../_lib/placement';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const id  = url.pathname.split('/').pop() ?? '';

  if (!id) {
    return Response.json({ error: 'Missing id' }, { status: 400, headers: CORS_HEADERS });
  }

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const paintings = await getPaintings();
    const painting  = paintings.find((p) => p.id === id);
    if (!painting) {
      return Response.json({ error: 'Not found' }, { status: 404, headers: CORS_HEADERS });
    }
    return Response.json(painting, { headers: CORS_HEADERS });
  }

  // ── PUT ──────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    let body: Partial<Painting>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
    }

    const paintings = await getPaintings();
    const idx       = paintings.findIndex((p) => p.id === id);
    if (idx === -1) {
      return Response.json({ error: 'Not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const oldPainting   = paintings[idx];
    const updatedPainting: Painting = { ...oldPainting, ...body, id };
    paintings[idx]      = updatedPainting;
    await setPaintings(paintings);

    // Update assignment if rack changed
    const assignment = await getAssignment();
    if (assignment && oldPainting.assignedRackName !== updatedPainting.assignedRackName) {
      // Remove from old rack
      if (oldPainting.assignedRackName) {
        const oldRack = assignment.racks.find((r) => r.name === oldPainting.assignedRackName);
        if (oldRack) {
          oldRack.paintings = oldRack.paintings.filter((p) => p.id !== id);
          // Rebuild placement for old rack
          const remaining = oldRack.paintings.map((p) => ({ ...p })) as Painting[];
          oldRack.paintings = [];
          const rebuilt = assignPaintingsToRacks(remaining, [{ ...oldRack }]);
          oldRack.paintings = rebuilt.racks[0]?.paintings ?? [];
        }
      }

      // Add to new rack
      if (updatedPainting.assignedRackName) {
        const newRack = assignment.racks.find((r) => r.name === updatedPainting.assignedRackName);
        if (newRack) {
          const state = buildShelfState(newRack.paintings as PlacedPainting[]);
          tryPlace(updatedPainting, state, newRack.rackType.width, newRack.rackType.height);
          newRack.paintings = state.paintings;
        } else {
          // rack not in assignment — add to unassigned
          assignment.unassigned = assignment.unassigned.filter((p) => p.id !== id);
          assignment.unassigned.push(updatedPainting);
        }
      } else {
        // Moved to unassigned
        assignment.unassigned = assignment.unassigned.filter((p) => p.id !== id);
        assignment.unassigned.push(updatedPainting);
      }

      await setAssignment(assignment);
    }

    return Response.json(updatedPainting, { headers: CORS_HEADERS });
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const paintings = await getPaintings();
    const painting  = paintings.find((p) => p.id === id);
    if (!painting) {
      return Response.json({ error: 'Not found' }, { status: 404, headers: CORS_HEADERS });
    }

    // Remove from paintings list
    await setPaintings(paintings.filter((p) => p.id !== id));

    // Remove from assignment
    const assignment = await getAssignment();
    let freedSpace: { rackName: string; width: number; height: number } | null = null;

    if (assignment) {
      assignment.unassigned = assignment.unassigned.filter((p) => p.id !== id);

      for (const rack of assignment.racks) {
        const beforeCount = rack.paintings.length;
        rack.paintings    = rack.paintings.filter((p) => p.id !== id);
        if (rack.paintings.length < beforeCount) {
          freedSpace = { rackName: rack.name, width: painting.width, height: painting.height };
          // Rebuild placement for rack to recalculate x,y
          const remaining = rack.paintings.map((p) => ({ ...p })) as Painting[];
          rack.paintings  = [];
          const rebuilt   = assignPaintingsToRacks(remaining, [{ ...rack }]);
          rack.paintings  = rebuilt.racks[0]?.paintings ?? [];
          break;
        }
      }
      await setAssignment(assignment);
    }

    return Response.json({ ok: true, freedSpace }, { headers: CORS_HEADERS });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
}

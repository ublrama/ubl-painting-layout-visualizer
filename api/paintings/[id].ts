/**
 * GET    /api/paintings/[id]  — get single painting
 * PUT    /api/paintings/[id]  — update painting
 * DELETE /api/paintings/[id]  — delete painting
 */

import type { Painting, PlacedPainting } from '../../src/types';
import { getPaintings, upsertPainting, deletePainting, getAssignment, setAssignment, updatePaintingPosition } from '../_lib/store.js';
import { buildPackState, tryPlace, assignPaintingsToRacks } from '../_lib/placement.js';
import { verifyClerkToken, unauthorized } from '../_lib/auth.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url, 'http://localhost');
  const id  = url.pathname.split('/').pop() ?? '';

  if (!id) {
    return Response.json({ error: 'Missing id' }, { status: 400, headers: CORS_HEADERS });
  }

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { paintings } = await getPaintings();
    const painting  = paintings.find((p) => p.id === id);
    if (!painting) {
      return Response.json({ error: 'Not found' }, { status: 404, headers: CORS_HEADERS });
    }
    return Response.json(painting, { headers: CORS_HEADERS });
  }

  // ── PUT ──────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const auth = await verifyClerkToken(req);
    if (!auth) return unauthorized();

    let body: Partial<Painting> & { x?: number; y?: number };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
    }

    // ── Position-only update (drag-and-drop repositioning) ─────────────
    // When only x and y are provided (no Painting fields), just update the
    // placed_paintings row without touching painting metadata or placement.
    if (body.x !== undefined && body.y !== undefined && Object.keys(body).length === 2) {
      await updatePaintingPosition(id, body.x, body.y);
      return Response.json({ ok: true }, { headers: CORS_HEADERS });
    }

    const { paintings } = await getPaintings();
    const idx       = paintings.findIndex((p) => p.id === id);
    if (idx === -1) {
      return Response.json({ error: 'Not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const oldPainting   = paintings[idx];
    const updatedPainting: Painting = { ...oldPainting, ...body, id };
    await upsertPainting(updatedPainting);

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
          const state = buildPackState(newRack.paintings as PlacedPainting[], newRack.rackType.width, newRack.rackType.height);
          tryPlace(updatedPainting, state);
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
    const auth = await verifyClerkToken(req);
    if (!auth) return unauthorized();

    const { paintings } = await getPaintings();
    const painting  = paintings.find((p) => p.id === id);
    if (!painting) {
      return Response.json({ error: 'Not found' }, { status: 404, headers: CORS_HEADERS });
    }

    await deletePainting(id); // cascade deletes placed_paintings row too

    // Rebuild assignment for the rack this painting was on
    const assignment = await getAssignment();
    let freedSpace: { rackName: string; width: number; height: number } | null = null;

    if (assignment && painting.assignedRackName) {
      freedSpace = { rackName: painting.assignedRackName, width: painting.width, height: painting.height };
      // Rebuild placement for rack to recalculate x,y
      const rack = assignment.racks.find((r) => r.name === painting.assignedRackName);
      if (rack) {
        const remaining = rack.paintings.filter((p) => p.id !== id) as Painting[];
        rack.paintings = [];
        const rebuilt = assignPaintingsToRacks(remaining, [{ ...rack }]);
        rack.paintings = rebuilt.racks[0]?.paintings ?? [];
        await setAssignment(assignment);
      }
    }

    return Response.json({ ok: true, freedSpace }, { headers: CORS_HEADERS });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
}

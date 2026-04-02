/**
 * GET  /api/paintings  — list paintings with optional filtering/sorting
 * POST /api/paintings  — create a new painting
 */

import { v4 as uuidv4 } from 'uuid';
import type { Painting, PlacedPainting } from '../src/types';
import { getPaintings, upsertPainting, getAssignment, setAssignment } from './_lib/store.js';
import { buildShelfState, tryPlace } from './_lib/placement.js';
import { verifyClerkToken, unauthorized } from './_lib/auth.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // ── GET ────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const url        = new URL(req.url, 'http://localhost');
      const search     = url.searchParams.get('search')?.toLowerCase() ?? '';
      const collection = url.searchParams.get('collection') ?? '';
      const assigned   = url.searchParams.get('assigned') ?? 'all';
      const sort       = url.searchParams.get('sort') ?? 'signatuur';
      const order      = url.searchParams.get('order') ?? 'asc';

      let paintings = await getPaintings();

      if (search) {
        paintings = paintings.filter(
          (p) =>
            p.signatuur.toLowerCase().includes(search) ||
            p.collection.toLowerCase().includes(search),
        );
      }
      if (collection) {
        paintings = paintings.filter((p) => p.collection === collection);
      }
      if (assigned === 'true') {
        paintings = paintings.filter((p) => p.assignedRackName !== null);
      } else if (assigned === 'false') {
        paintings = paintings.filter((p) => p.assignedRackName === null);
      }

      paintings = paintings.sort((a, b) => {
        let cmp = 0;
        switch (sort) {
          case 'width':      cmp = a.width  - b.width;  break;
          case 'height':     cmp = a.height - b.height; break;
          case 'depth':      cmp = a.depth  - b.depth;  break;
          case 'collection': cmp = a.collection.localeCompare(b.collection); break;
          default:           cmp = a.signatuur.localeCompare(b.signatuur);   break;
        }
        return order === 'desc' ? -cmp : cmp;
      });

      return Response.json(paintings, { headers: CORS_HEADERS });
    }

    // ── POST ───────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const auth = await verifyClerkToken(req);
      if (!auth) return unauthorized();

      let body: Partial<Painting>;
      try {
        body = await req.json();
      } catch {
        return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
      }

      const { signatuur, collection, width, height, depth, assignedRackName } = body;
      if (!signatuur || !collection || width == null || height == null || depth == null) {
        return Response.json({ error: 'Missing required fields' }, { status: 400, headers: CORS_HEADERS });
      }

      const newPainting: Painting = {
        id: uuidv4(),
        signatuur: String(signatuur),
        collection: String(collection),
        width: Number(width),
        height: Number(height),
        depth: Number(depth),
        assignedRackName: assignedRackName ?? null,
        manuallyPlaced: false,
        predefinedRack: null,
      };

      await upsertPainting(newPainting);

      if (newPainting.assignedRackName) {
        const assignment = await getAssignment();
        if (assignment) {
          const rack = assignment.racks.find((r) => r.name === newPainting.assignedRackName);
          if (rack) {
            const state = buildShelfState(rack.paintings as PlacedPainting[]);
            tryPlace(newPainting, state, rack.rackType.width, rack.rackType.height);
            rack.paintings = state.paintings;
            await setAssignment(assignment);
          }
        }
      }

      return Response.json(newPainting, { status: 201, headers: CORS_HEADERS });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
  } catch (err) {
    console.error('[paintings] error:', err);
    return Response.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

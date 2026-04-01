/**
 * GET    /api/racks         — list all racks with painting count and available space info
 * POST   /api/racks         — create a new rack
 * DELETE  /api/racks?name=   — delete a rack
 */

import { getAssignment, getRacks, upsertSingleRack, deleteRack, getRackTypes } from './_lib/store';
import { verifyClerkToken, unauthorized } from './_lib/auth';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const [assignment, storedRacks] = await Promise.all([getAssignment(), getRacks()]);

    if (!assignment) {
      return Response.json(
        storedRacks.map((r) => ({ ...r, paintings: [], paintingCount: 0, usedArea: 0, totalArea: r.rackType.width * r.rackType.height })),
        { headers: CORS_HEADERS },
      );
    }

    const racksWithInfo = assignment.racks.map((rack) => {
      const totalArea  = rack.rackType.width * rack.rackType.height;
      const usedArea   = rack.paintings.reduce((s, p) => s + p.width * p.height, 0);
      return {
        ...rack,
        paintingCount: rack.paintings.length,
        usedArea,
        totalArea,
        availableArea: totalArea - usedArea,
      };
    });

    return Response.json(racksWithInfo, { headers: CORS_HEADERS });
  }

  // ── POST — create rack ───────────────────────────────────────────────────
  if (req.method === 'POST') {
    const auth = await verifyClerkToken(req);
    if (!auth) return unauthorized();

    let body: { name?: string; rackTypeId?: number };
    try { body = await req.json(); } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
    }

    const { name, rackTypeId } = body;
    if (!name || rackTypeId == null) {
      return Response.json({ error: 'Missing required fields: name, rackTypeId' }, { status: 400, headers: CORS_HEADERS });
    }

    // Verify rack type exists
    const rackTypes = await getRackTypes();
    const rt = rackTypes.find((t) => t.id === rackTypeId);
    if (!rt) {
      return Response.json({ error: `Rack type ${rackTypeId} not found` }, { status: 404, headers: CORS_HEADERS });
    }

    await upsertSingleRack(name, rackTypeId);
    return Response.json({ name, rackType: rt, paintings: [] }, { status: 201, headers: CORS_HEADERS });
  }

  // ── DELETE — delete rack ─────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const auth = await verifyClerkToken(req);
    if (!auth) return unauthorized();

    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    if (!name) {
      return Response.json({ error: 'Missing name query parameter' }, { status: 400, headers: CORS_HEADERS });
    }

    try {
      await deleteRack(name);
      return Response.json({ ok: true }, { headers: CORS_HEADERS });
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 500, headers: CORS_HEADERS });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
}


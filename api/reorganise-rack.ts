/**
 * POST /api/reorganise-rack
 * Re-runs the bin-packing algorithm for a single rack, optimising the
 * positions of all paintings currently on it.
 *
 * Body: { rackName: string }
 *
 * Protected by Clerk JWT verification.
 */

import type { Painting } from '../src/types';
import { getAssignment, setAssignment } from './_lib/store.js';
import { assignPaintingsToRacks } from './_lib/placement.js';
import { verifyClerkToken, unauthorized } from './_lib/auth.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
  }

  const auth = await verifyClerkToken(req);
  if (!auth) return unauthorized();

  let body: { rackName?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  const { rackName } = body;
  if (!rackName) {
    return Response.json({ error: 'Missing rackName' }, { status: 400, headers: CORS_HEADERS });
  }

  const assignment = await getAssignment();
  if (!assignment) {
    return Response.json({ error: 'No assignment found' }, { status: 404, headers: CORS_HEADERS });
  }

  const rack = assignment.racks.find((r) => r.name === rackName);
  if (!rack) {
    return Response.json({ error: 'Rack not found' }, { status: 404, headers: CORS_HEADERS });
  }

  // Re-run bin-packing for this rack's current paintings
  const paintings = rack.paintings.map((p) => ({ ...p, assignedRackName: rackName })) as Painting[];
  rack.paintings = [];

  const rebuilt = assignPaintingsToRacks(paintings, [{ ...rack, paintings: [] }]);
  rack.paintings = rebuilt.racks[0]?.paintings ?? [];

  // Any paintings that no longer fit (shouldn't happen, but guard anyway) → unassigned
  for (const p of rebuilt.unassigned) {
    p.assignedRackName = null;
    assignment.unassigned.push(p);
  }

  await setAssignment(assignment);

  return Response.json(
    { ok: true, placed: rack.paintings.length, unassigned: rebuilt.unassigned.length },
    { headers: CORS_HEADERS },
  );
}


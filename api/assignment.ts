/**
 * GET  /api/assignment         — get stored assignment
 * POST /api/assignment/confirm — freeze the assignment
 * POST /api/assignment/reset   — unfreeze the assignment (admin)
 */

import { getAssignment, setAssignment } from './_lib/store';
import { verifyClerkToken, unauthorized } from './_lib/auth';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url      = new URL(req.url);
  const subPath  = url.pathname.replace(/^\/api\/assignment\/?/, '');

  // ── POST /api/assignment/confirm ─────────────────────────────────────────
  if (req.method === 'POST' && subPath === 'confirm') {
    const auth = await verifyClerkToken(req);
    if (!auth) return unauthorized();

    const assignment = await getAssignment();
    if (!assignment) {
      return Response.json({ error: 'No assignment found' }, { status: 404, headers: CORS_HEADERS });
    }
    assignment.confirmedAt = new Date().toISOString();
    await setAssignment(assignment);
    return Response.json(assignment, { headers: CORS_HEADERS });
  }

  // ── POST /api/assignment/reset ───────────────────────────────────────────
  if (req.method === 'POST' && subPath === 'reset') {
    const auth = await verifyClerkToken(req);
    if (!auth) return unauthorized();

    const assignment = await getAssignment();
    if (!assignment) {
      return Response.json({ error: 'No assignment found' }, { status: 404, headers: CORS_HEADERS });
    }
    assignment.confirmedAt = null;
    await setAssignment(assignment);
    return Response.json(assignment, { headers: CORS_HEADERS });
  }

  // ── GET /api/assignment ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    const assignment = await getAssignment();
    if (!assignment) {
      return Response.json({ error: 'No assignment found' }, { status: 404, headers: CORS_HEADERS });
    }
    return Response.json(assignment, { headers: CORS_HEADERS });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
}

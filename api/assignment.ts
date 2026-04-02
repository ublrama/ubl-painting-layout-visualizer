/**
 * GET  /api/assignment         — get stored assignment
 * POST /api/assignment/confirm — freeze the assignment
 * POST /api/assignment/reset   — unfreeze the assignment (admin)
 */

import { getAssignment, setAssignment } from './_lib/store.js';
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
    const url      = new URL(req.url, 'http://localhost');
    const subPath  = url.pathname.replace(/^\/api\/assignment\/?/, '');

    // ── POST /api/assignment/confirm ───────────────────────────────────────
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

    // ── POST /api/assignment/reset ─────────────────────────────────────────
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

    // ── GET /api/assignment ────────────────────────────────────────────────
    if (req.method === 'GET') {
      const reqStart = Date.now();
      console.log('[assignment] GET start');

      const assignment = await getAssignment();
      console.log(`[assignment] getAssignment() returned in ${Date.now() - reqStart} ms`);

      if (!assignment) {
        return Response.json(null, { status: 200, headers: CORS_HEADERS });
      }

      const serialiseStart = Date.now();
      const body = JSON.stringify(assignment);
      console.log(`[assignment] JSON.stringify took ${Date.now() - serialiseStart} ms  (${body.length} chars)`);
      console.log(`[assignment] total handler time ${Date.now() - reqStart} ms`);

      return new Response(body, {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
  } catch (err) {
    console.error('[assignment] error:', err);
    return Response.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

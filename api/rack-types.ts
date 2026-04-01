/**
 * GET  /api/rack-types      — list all rack types
 * POST /api/rack-types      — create/update a rack type
 * DELETE /api/rack-types?id= — delete a rack type
 */

import type { RackType } from '../src/types';
import { getRackTypes, upsertRackType, deleteRackType } from './_lib/store';
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

  // GET — list
  if (req.method === 'GET') {
    const types = await getRackTypes();
    return Response.json(types, { headers: CORS_HEADERS });
  }

  // POST — create/update
  if (req.method === 'POST') {
    const auth = await verifyClerkToken(req);
    if (!auth) return unauthorized();

    let body: Partial<RackType>;
    try { body = await req.json(); } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
    }

    const { id, height, width, maxDepth } = body;
    if (id == null || height == null || width == null || maxDepth == null) {
      return Response.json({ error: 'Missing required fields: id, height, width, maxDepth' }, { status: 400, headers: CORS_HEADERS });
    }

    const rt: RackType = { id: Number(id), height: Number(height), width: Number(width), maxDepth: Number(maxDepth) };
    await upsertRackType(rt);
    return Response.json(rt, { status: 201, headers: CORS_HEADERS });
  }

  // DELETE — remove
  if (req.method === 'DELETE') {
    const auth = await verifyClerkToken(req);
    if (!auth) return unauthorized();

    const url = new URL(req.url);
    const idParam = url.searchParams.get('id');
    if (!idParam) {
      return Response.json({ error: 'Missing id query parameter' }, { status: 400, headers: CORS_HEADERS });
    }

    try {
      await deleteRackType(parseInt(idParam, 10));
      return Response.json({ ok: true }, { headers: CORS_HEADERS });
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 409, headers: CORS_HEADERS });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
}


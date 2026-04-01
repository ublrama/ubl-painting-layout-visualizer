/**
 * POST /api/clear-all — delete all data (paintings, racks, rack types, assignment state)
 */

import { clearAll } from './_lib/store';
import { verifyClerkToken, unauthorized } from './_lib/auth';

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

  try {
    await clearAll();
    return Response.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: CORS_HEADERS });
  }
}


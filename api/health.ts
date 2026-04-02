/**
 * GET /api/health
 * Returns the status of the Supabase connection and environment configuration.
 * No authentication required — safe to call from the UI before login.
 */

import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      { ok: false, stage: 'env', error: 'SUPABASE_URL or SUPABASE_SERVICE_KEY is not set.' },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 5000),
    );

    const { data, error } = await Promise.race([
      supabase.from('rack_types').select('id').limit(1),
      timeoutPromise,
    ]);

    if (error) {
      return Response.json(
        { ok: false, stage: 'query', error: error.message },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    return Response.json(
      { ok: true, stage: 'connected', hasData: (data?.length ?? 0) > 0 },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === 'TIMEOUT';
    return Response.json(
      {
        ok: false,
        stage: isTimeout ? 'timeout' : 'connection',
        error: isTimeout
          ? 'Supabase did not respond within 5 seconds. The project may be paused or the URL is wrong.'
          : String(err),
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

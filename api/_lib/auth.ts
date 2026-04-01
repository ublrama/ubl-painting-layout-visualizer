/**
 * Verifies a Supabase JWT token from the Authorization header.
 * Returns the userId if valid, or null if missing/invalid.
 *
 * Uses the Supabase service key to call supabase.auth.getUser(token).
 * Configure via:
 *   SUPABASE_URL=https://xxxx.supabase.co        (already present)
 *   SUPABASE_SERVICE_KEY=eyJ...                   (already present)
 */

export interface AuthResult {
  userId: string;
  sessionId: string;
}

export async function verifyToken(req: Request): Promise<AuthResult | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Auth not configured — allow all requests (dev mode)
    return { userId: 'dev-user', sessionId: 'dev-session' };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { userId: user.id, sessionId: user.id };
  } catch {
    return null;
  }
}

// Alias so existing callers in assignment.ts, paintings.ts, seed.ts, racks.ts don't break.
export const verifyClerkToken = verifyToken;

/**
 * Returns a 401 Response for unauthorized requests.
 */
export function unauthorized(): Response {
  return Response.json(
    { error: 'Unauthorized' },
    {
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'WWW-Authenticate': 'Bearer',
      },
    },
  );
}

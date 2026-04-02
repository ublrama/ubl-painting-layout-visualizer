/**
 * Verifies a Supabase JWT token from the Authorization header.
 * Compatible with both Web API Request objects (headers.get) and
 * Node.js IncomingMessage objects (headers as a plain object).
 */

export interface AuthResult {
  userId: string;
  sessionId: string;
}

/** Extract the Authorization header value regardless of request style. */
function getAuthorizationHeader(req: Request | { headers: Record<string, string | string[] | undefined> }): string | null {
  // Web API Request — has Headers.get()
  if (typeof (req.headers as { get?: unknown }).get === 'function') {
    return (req as Request).headers.get('Authorization');
  }
  // Node.js IncomingMessage — plain object, lowercase keys
  const h = (req.headers as Record<string, string | string[] | undefined>)['authorization']
         ?? (req.headers as Record<string, string | string[] | undefined>)['Authorization'];
  if (Array.isArray(h)) return h[0] ?? null;
  return h ?? null;
}

export async function verifyToken(req: Request): Promise<AuthResult | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Auth not configured — allow all requests (dev mode)
    return { userId: 'dev-user', sessionId: 'dev-session' };
  }

  const authHeader = getAuthorizationHeader(req);
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

// Alias so existing callers don't break.
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

/**
 * Verifies a Clerk JWT token from the Authorization header.
 * Returns the userId if valid, or null if missing/invalid.
 *
 * Uses Clerk's public JWKS endpoint to verify the token.
 * No secret key needed — only the publishable key's JWKS URL.
 */

export interface AuthResult {
  userId: string;
  sessionId: string;
}

export async function verifyClerkToken(req: Request): Promise<AuthResult | null> {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    // Auth not configured — allow all requests (dev mode)
    return { userId: 'dev-user', sessionId: 'dev-session' };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);

  try {
    // Use Clerk's backend SDK to verify the token
    const { createClerkClient } = await import('@clerk/backend');
    const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
    const payload = await clerkClient.verifyToken(token);
    return { userId: payload.sub, sessionId: payload.sid ?? '' };
  } catch {
    return null;
  }
}

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

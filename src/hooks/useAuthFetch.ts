import { useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

/**
 * Returns a fetch function that automatically attaches the Clerk Bearer token.
 * Falls back to regular fetch if Clerk is not configured.
 * Reads the token via AuthContext, which is populated by ClerkAuthProvider
 * when ClerkProvider is present.
 */
export function useAuthFetch() {
  const { getToken } = useAuthContext();

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers ?? {});
      if (getToken) {
        const token = await getToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);
      }
      return fetch(url, { ...options, headers });
    },
    [getToken],
  );

  return authFetch;
}

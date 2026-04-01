import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  getToken: (() => Promise<string | null>) | null;
  signOut: (() => Promise<void>) | null;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  getToken: null,
  signOut: null,
});

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}

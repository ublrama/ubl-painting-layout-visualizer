import { createContext, useContext } from 'react';

interface AuthContextValue {
  getToken: (() => Promise<string | null>) | null;
}

export const AuthContext = createContext<AuthContextValue>({ getToken: null });

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}

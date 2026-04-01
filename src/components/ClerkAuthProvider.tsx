import { useAuth } from '@clerk/clerk-react';
import { AuthContext } from '../contexts/AuthContext';

interface ClerkAuthProviderProps {
  children: React.ReactNode;
}

/**
 * Must be rendered inside <ClerkProvider>.
 * Reads the Clerk getToken function and exposes it via AuthContext.
 */
export function ClerkAuthProvider({ children }: ClerkAuthProviderProps) {
  const { getToken } = useAuth();
  return (
    <AuthContext.Provider value={{ getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

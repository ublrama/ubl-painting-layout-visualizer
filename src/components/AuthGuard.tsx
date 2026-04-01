import { useAuthContext } from '../contexts/AuthContext';
import { SignInPage } from './SignInPage';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, getToken } = useAuthContext();

  // If Supabase is not configured, render children directly (dev/no-auth mode)
  if (!getToken) return <>{children}</>;

  if (!user) return <SignInPage />;

  return <>{children}</>;
}

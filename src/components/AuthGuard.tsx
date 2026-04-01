import { SignIn, SignedIn, SignedOut } from '@clerk/clerk-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  // If Clerk is not configured, render children directly (dev/no-auth mode)
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }

  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-[#001158] flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🏛️</div>
              <h1 className="text-2xl font-bold text-white">Schilderijen Planner</h1>
              <p className="text-[#8b9db8] text-sm mt-1">Universiteit Leiden — Museum Layout Visualizer</p>
            </div>
            <SignIn routing="hash" />
          </div>
        </div>
      </SignedOut>
    </>
  );
}

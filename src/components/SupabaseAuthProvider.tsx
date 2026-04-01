import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../contexts/AuthContext';

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const getToken = supabase
    ? async () => {
        const { data } = await supabase!.auth.getSession();
        return data.session?.access_token ?? null;
      }
    : null;

  const signOut = supabase ? async () => { await supabase!.auth.signOut(); } : null;

  return (
    <AuthContext.Provider value={{ user, getToken, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

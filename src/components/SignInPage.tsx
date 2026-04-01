import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'signin' | 'signup' | 'forgot';

export function SignInPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'forgot') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (err) throw err;
        setSuccess('Check je e-mail voor een inloglink.');
      } else if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSuccess('Account aangemaakt! Check je e-mail om te bevestigen.');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        // Auth state change handled by SupabaseAuthProvider
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#001158] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏛️</div>
          <h1 className="text-2xl font-bold text-white">Schilderijen Planner</h1>
          <p className="text-[#8b9db8] text-sm mt-1">Universiteit Leiden — Museum Layout Visualizer</p>
        </div>

        {/* Card */}
        <div className="bg-[#0a2060] border border-[#002580] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-white font-semibold text-base mb-5">
            {mode === 'signin' && 'Inloggen'}
            {mode === 'signup' && 'Account aanmaken'}
            {mode === 'forgot' && 'Wachtwoord vergeten'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#8b9db8] mb-1.5">
                E-mailadres
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@universiteitleiden.nl"
                className="w-full bg-[#001158] border border-[#002580] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4a5f80] focus:outline-none focus:border-[#be1908] focus:ring-1 focus:ring-[#be1908] transition-colors"
              />
            </div>

            {/* Password — hidden in forgot mode */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-[#8b9db8] mb-1.5">
                  Wachtwoord
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#001158] border border-[#002580] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#4a5f80] focus:outline-none focus:border-[#be1908] focus:ring-1 focus:ring-[#be1908] transition-colors"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-900/40 border border-red-700 px-3 py-2 text-red-300 text-xs">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="rounded-lg bg-green-900/40 border border-green-700 px-3 py-2 text-green-300 text-xs">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#be1908] hover:bg-[#d41f08] disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              {loading
                ? 'Bezig…'
                : mode === 'signin'
                  ? 'Inloggen'
                  : mode === 'signup'
                    ? 'Account aanmaken'
                    : 'Stuur inloglink'}
            </button>
          </form>

          {/* Toggle sign-in / sign-up */}
          <div className="mt-4 text-center">
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                className="text-xs text-[#8b9db8] hover:text-white transition-colors"
              >
                Geen account?{' '}
                <span className="text-[#be1908] hover:underline font-medium">Aanmaken</span>
              </button>
            )}
            {mode === 'signup' && (
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                className="text-xs text-[#8b9db8] hover:text-white transition-colors"
              >
                Al een account?{' '}
                <span className="text-[#be1908] hover:underline font-medium">Inloggen</span>
              </button>
            )}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                className="text-xs text-[#8b9db8] hover:text-white transition-colors"
              >
                Terug naar{' '}
                <span className="text-[#be1908] hover:underline font-medium">inloggen</span>
              </button>
            )}
          </div>

          {/* Forgot password link */}
          {mode === 'signin' && (
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                className="text-xs text-[#4a5f80] hover:text-[#8b9db8] transition-colors"
              >
                Wachtwoord vergeten?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

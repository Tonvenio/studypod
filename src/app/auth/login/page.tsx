'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const mod = await import('@/lib/supabase/client');
      const supabase = mod.createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-[family-name:var(--font-press-start)] text-sm inline-block mb-6">
            <span className="text-[var(--c-primary)]">study</span>
            <span className="text-[var(--c-fg)]">pod</span>
            <span className="text-[var(--c-accent)]">.ai</span>
          </Link>
          <h1 className="font-[family-name:var(--font-press-start)] text-lg pixel-shadow">WELCOME BACK</h1>
          <p className="text-[var(--c-muted)] text-sm mt-2">Continue your quest</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] block mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pixel-border bg-[var(--c-surface)] px-4 py-3 text-[var(--c-fg)] placeholder:text-[var(--c-muted)] focus:outline-none"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] block mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pixel-border bg-[var(--c-surface)] px-4 py-3 text-[var(--c-fg)] placeholder:text-[var(--c-muted)] focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-[var(--c-danger)] text-sm pixel-border-sm bg-[var(--c-danger)]/10 px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full pixel-border-sm bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white py-3 font-bold transition-pixel disabled:opacity-50"
          >
            {loading ? 'LOADING...' : 'LOG IN'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--c-muted)] mt-6">
          New adventurer?{' '}
          <Link href="/auth/register" className="text-[var(--c-primary)] hover:text-[var(--c-primary-hover)] transition-pixel font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}

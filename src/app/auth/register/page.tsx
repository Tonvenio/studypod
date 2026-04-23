'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const mod = await import('@/lib/supabase/client');
      const supabase = mod.createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-dvh bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="font-[family-name:var(--font-press-start)] text-2xl text-[var(--c-accent)] mb-4">✓</div>
          <h1 className="font-[family-name:var(--font-press-start)] text-lg mb-2">ACCOUNT CREATED</h1>
          <p className="text-[var(--c-muted)] mb-6">Check your email to confirm, then start your quest.</p>
          <Link href="/auth/login" className="pixel-border-sm bg-[var(--c-primary)] text-white px-6 py-3 font-bold transition-pixel">
            LOG IN
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[var(--c-bg)] text-[var(--c-fg)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-[family-name:var(--font-press-start)] text-sm inline-block mb-6">
            <span className="text-[var(--c-primary)]">study</span>
            <span className="text-[var(--c-fg)]">pod</span>
            <span className="text-[var(--c-accent)]">.ai</span>
          </Link>
          <h1 className="font-[family-name:var(--font-press-start)] text-lg pixel-shadow">CREATE ADVENTURER</h1>
          <p className="text-[var(--c-muted)] text-sm mt-2">Join the quest for knowledge</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] block mb-2">USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pixel-border bg-[var(--c-surface)] px-4 py-3.5 text-base text-[var(--c-fg)] placeholder:text-[var(--c-muted)] focus:outline-none"
              placeholder="your_name"
              required
            />
          </div>
          <div>
            <label className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] block mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pixel-border bg-[var(--c-surface)] px-4 py-3.5 text-base text-[var(--c-fg)] placeholder:text-[var(--c-muted)] focus:outline-none"
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
              className="w-full pixel-border bg-[var(--c-surface)] px-4 py-3.5 text-base text-[var(--c-fg)] placeholder:text-[var(--c-muted)] focus:outline-none"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="text-[var(--c-danger)] text-sm pixel-border-sm bg-[var(--c-danger)]/10 px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full pixel-border-sm bg-[var(--c-accent)] hover:bg-[var(--c-accent-hover)] text-[var(--c-bg)] py-3 font-bold transition-pixel disabled:opacity-50"
          >
            {loading ? 'CREATING...' : 'START QUEST'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--c-muted)] mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[var(--c-primary)] hover:text-[var(--c-primary-hover)] transition-pixel font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

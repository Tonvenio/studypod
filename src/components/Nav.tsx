'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

interface NavProps {
  rightContent?: React.ReactNode;
}

export default function Nav({ rightContent }: NavProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch {}
    }
    checkAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {}
  };

  return (
    <nav className="border-b-2 border-[var(--c-border)]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-[family-name:var(--font-press-start)] text-sm">
          <span className="text-[var(--c-primary)]">study</span>
          <span className="text-[var(--c-fg)]">pod</span>
          <span className="text-[var(--c-accent)]">.ai</span>
        </Link>
        <div className="flex items-center gap-3">
          {rightContent}
          <ThemeToggle />
          {isLoggedIn ? (
            <button
              onClick={handleSignOut}
              className="text-xs text-[var(--c-muted)] hover:text-[var(--c-danger)] transition-pixel py-2"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/auth/register"
              className="pixel-border-sm bg-[var(--c-primary)] text-white text-xs font-bold px-4 py-2 hover:bg-[var(--c-primary-hover)] transition-pixel"
            >
              SIGN UP
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

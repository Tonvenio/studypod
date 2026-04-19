'use client';

import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

interface NavProps {
  showDashboard?: boolean;
  showMobile?: boolean;
  showSignUp?: boolean;
  rightContent?: React.ReactNode;
}

export default function Nav({ showDashboard = false, showMobile = false, showSignUp = false, rightContent }: NavProps) {
  return (
    <nav className="border-b-2 border-[var(--c-border)]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-[family-name:var(--font-press-start)] text-sm">
          <span className="text-[var(--c-primary)]">study</span>
          <span className="text-[var(--c-fg)]">pod</span>
          <span className="text-[var(--c-accent)]">.ai</span>
        </Link>
        <div className="flex items-center gap-3">
          {showDashboard && (
            <Link href="/dashboard" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel">
              Dashboard
            </Link>
          )}
          {showMobile && (
            <Link href="/guide/mobile-listening" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel">
              Mobile
            </Link>
          )}
          {rightContent}
          <ThemeToggle />
          {showSignUp && (
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

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import AppStoreButton from '@/components/AppStoreButton';
import { PRICES } from '@/lib/billing/plans';

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(variantId: string) {
    setLoading(variantId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert('Something went wrong. Please try again.');
    }
    setLoading(null);
  }

  return (
    <main className="min-h-dvh bg-[var(--c-bg)] text-[var(--c-fg)]">
      <Nav rightContent={
        <Link href="/dashboard" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2">Dashboard</Link>
      } />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-[family-name:var(--font-press-start)] text-xl sm:text-2xl mb-3 pixel-shadow">CHOOSE YOUR PATH</h1>
          <p className="text-[var(--c-muted)] text-sm">Study smarter. Level up faster.</p>

          {/* Billing toggle */}
          <div className="flex justify-center gap-1 mt-6">
            <button
              onClick={() => setBilling('monthly')}
              className={`font-[family-name:var(--font-press-start)] text-[8px] px-4 py-2.5 pixel-border-sm transition-pixel ${
                billing === 'monthly' ? 'bg-[var(--c-primary)] text-white' : 'bg-[var(--c-surface)] text-[var(--c-muted)]'
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`font-[family-name:var(--font-press-start)] text-[8px] px-4 py-2.5 pixel-border-sm transition-pixel ${
                billing === 'annual' ? 'bg-[var(--c-primary)] text-white' : 'bg-[var(--c-surface)] text-[var(--c-muted)]'
              }`}
            >
              ANNUAL
              <span className="ml-1 text-[var(--c-accent)]">-33%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Free */}
          <div className="pixel-border bg-[var(--c-surface)] p-6">
            <p className="font-[family-name:var(--font-press-start)] text-xs text-[var(--c-muted)] mb-4">FREE</p>
            <p className="font-[family-name:var(--font-press-start)] text-3xl text-[var(--c-fg)] mb-1">€0</p>
            <p className="text-xs text-[var(--c-muted)] mb-6">forever</p>

            <ul className="space-y-2 text-sm mb-6">
              <li className="text-[var(--c-fg)]">3 decks per month</li>
              <li className="text-[var(--c-fg)]">10 cards per deck</li>
              <li className="text-[var(--c-fg)]">2 audio cards per deck</li>
              <li className="text-[var(--c-fg)]">Full gamification</li>
              <li className="text-[var(--c-fg)]">Spaced repetition</li>
              <li className="text-[var(--c-muted)] line-through">Document upload</li>
              <li className="text-[var(--c-muted)] line-through">Podcast feed</li>
            </ul>

            <Link
              href="/auth/register"
              className="block text-center pixel-border-sm bg-[var(--c-border)] text-[var(--c-fg)] py-3 font-semibold transition-pixel hover:bg-[var(--c-surface-hover)]"
            >
              GET STARTED
            </Link>
          </div>

          {/* Pro */}
          <div className="pixel-border bg-[var(--c-surface)] p-6 border-2 border-[var(--c-primary)] relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--c-primary)] px-3 py-1">
              <span className="font-[family-name:var(--font-press-start)] text-[8px] text-white">MOST POPULAR</span>
            </div>

            <p className="font-[family-name:var(--font-press-start)] text-xs text-[var(--c-primary)] mb-4">PRO</p>
            <div className="mb-1">
              {billing === 'annual' ? (
                <>
                  <span className="font-[family-name:var(--font-press-start)] text-3xl text-[var(--c-fg)]">{PRICES.proAnnual.label.split('/')[0]}</span>
                  <span className="text-[var(--c-muted)] text-sm">/mo</span>
                </>
              ) : (
                <>
                  <span className="font-[family-name:var(--font-press-start)] text-3xl text-[var(--c-fg)]">{PRICES.proMonthly.label.split('/')[0]}</span>
                  <span className="text-[var(--c-muted)] text-sm">/mo</span>
                </>
              )}
            </div>
            <p className="text-xs text-[var(--c-muted)] mb-6">
              {billing === 'annual' ? `billed ${PRICES.proAnnual.period}` : 'billed monthly'}
            </p>

            <ul className="space-y-2 text-sm mb-6">
              <li className="text-[var(--c-accent)]">Unlimited decks</li>
              <li className="text-[var(--c-accent)]">30 cards per deck</li>
              <li className="text-[var(--c-accent)]">Unlimited audio</li>
              <li className="text-[var(--c-fg)]">Document upload (PDF, TXT)</li>
              <li className="text-[var(--c-fg)]">Podcast RSS feed</li>
              <li className="text-[var(--c-fg)]">iOS app sync</li>
              <li className="text-[var(--c-fg)]">Priority rendering</li>
            </ul>

            <button
              onClick={() => handleCheckout(
                billing === 'annual'
                  ? process.env.NEXT_PUBLIC_LS_PRO_ANNUAL || ''
                  : process.env.NEXT_PUBLIC_LS_PRO_MONTHLY || ''
              )}
              disabled={!!loading}
              className="w-full pixel-border-sm bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white py-3 font-semibold transition-pixel disabled:opacity-50"
            >
              {loading ? 'LOADING...' : 'UPGRADE TO PRO'}
            </button>
          </div>

          {/* Exam Boost */}
          <div className="pixel-border bg-[var(--c-surface)] p-6">
            <p className="font-[family-name:var(--font-press-start)] text-xs text-[var(--c-xp)] mb-4">EXAM BOOST</p>
            <p className="font-[family-name:var(--font-press-start)] text-3xl text-[var(--c-fg)] mb-1">{PRICES.examBoost.label.split(' ')[0]}</p>
            <p className="text-xs text-[var(--c-muted)] mb-6">30 days, one-time</p>

            <ul className="space-y-2 text-sm mb-6">
              <li className="text-[var(--c-accent)]">All Pro features</li>
              <li className="text-[var(--c-fg)]">No auto-renewal</li>
              <li className="text-[var(--c-fg)]">Perfect for Klausurphase</li>
              <li className="text-[var(--c-fg)]">30 days of unlimited access</li>
            </ul>

            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_LS_EXAM_BOOST || '')}
              disabled={!!loading}
              className="w-full pixel-border-sm bg-[var(--c-xp)] hover:opacity-90 text-[var(--c-bg)] py-3 font-semibold transition-pixel disabled:opacity-50"
            >
              {loading ? 'LOADING...' : 'GET EXAM BOOST'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--c-muted)] mt-8">
          All prices include VAT. Cancel anytime. Payments handled securely by LemonSqueezy.
        </p>

        <div className="text-center mt-10">
          <p className="font-[family-name:var(--font-press-start)] text-[10px] text-[var(--c-muted)] mb-4">ALSO AVAILABLE ON</p>
          <AppStoreButton className="mx-auto" />
        </div>
      </div>
    </main>
  );
}

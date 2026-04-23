import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review Session — studypod.ai',
  description: 'Spaced repetition review with XP, combos, and critical hits.',
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — studypod.ai',
  description: 'Your study quest log. Track XP, streaks, badges, and review due cards.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}

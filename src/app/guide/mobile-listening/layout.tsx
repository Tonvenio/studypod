import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Listen on Mobile — studypod.ai',
  description: 'Three ways to listen to your audio flashcards on your phone.',
};

export default function MobileGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}

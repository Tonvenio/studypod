import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Deck — studypod.ai',
  description: 'Generate AI-powered flashcards from any topic or document.',
};

export default function NewDeckLayout({ children }: { children: React.ReactNode }) {
  return children;
}

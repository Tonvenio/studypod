import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Study — studypod.ai',
  description: 'Study flashcards with flip-and-rate.',
};

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

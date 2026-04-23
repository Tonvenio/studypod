import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account — studypod.ai',
  description: 'Join the quest for knowledge. Create AI-powered audio flashcards.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}

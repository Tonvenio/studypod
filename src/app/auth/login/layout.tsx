import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In — studypod.ai',
  description: 'Sign in to continue your study quest.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

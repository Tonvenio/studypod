import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — studypod.ai',
  description: 'Study smarter with AI audio flashcards. Free tier or Pro from €3.99/month.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

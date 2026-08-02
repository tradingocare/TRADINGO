import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center | TRADINGO',
  description: 'Find answers to common questions, browse help articles, and contact TRADINGO support for assistance with your account, orders, and platform features.',
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

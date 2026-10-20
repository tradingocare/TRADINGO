import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'TradeServ | Global Business & Professional Services Marketplace' },
  description:
    'Find verified professionals and business service providers worldwide. Discover trusted expertise, professional services, and business solutions for commercial, retail, corporate, and professional needs through TradeServ.',
  openGraph: {
    title: 'TradeServ | Global Business & Professional Services Marketplace',
    description:
      'Find verified professionals and business service providers worldwide. Discover trusted expertise, professional services, and business solutions for commercial, retail, corporate, and professional needs through TradeServ.',
    url: '/service',
    type: 'website',
    siteName: 'TRADINGO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TradeServ | Global Business & Professional Services Marketplace',
    description:
      'Find verified professionals and business service providers worldwide. Discover trusted expertise, professional services, and business solutions for commercial, retail, corporate, and professional needs through TradeServ.',
  },
  alternates: {
    canonical: 'https://tradingo.in/service',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}

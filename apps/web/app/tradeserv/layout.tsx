import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TradeServ\u2122 \u2014 Professional Services Platform | TRADINGO',
  description:
    'Find and engage TRADTRUST-verified accountants, legal experts, consultants, and creative professionals. India\'s enterprise professional services platform, powered by TRADINGO.',
  openGraph: {
    title: 'TradeServ\u2122 \u2014 Professional Services Platform | TRADINGO',
    description:
      'Find and engage TRADTRUST-verified accountants, legal experts, consultants, and creative professionals.',
    url: '/tradeserv',
    type: 'website',
    siteName: 'TRADINGO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TradeServ\u2122 \u2014 Professional Services Platform | TRADINGO',
    description:
      'Find and engage TRADTRUST-verified accountants, legal experts, consultants, and creative professionals.',
  },
  alternates: {
    canonical: 'https://www.tradingo.com/tradeserv',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TradeServLayout({ children }: { children: React.ReactNode }) {
  return children;
}

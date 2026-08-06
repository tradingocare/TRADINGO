import type { Metadata } from 'next';
import RegisterClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Join TradeServ — Register as a Professional | TRADINGO',
  description:
    'Register on TradeServ and create your professional profile. Join India\'s AI-powered business services platform. Complete 7-step registration to get listed.',
  openGraph: {
    title: 'Join TradeServ — Register as a Professional | TRADINGO',
    description:
      'Register on TradeServ and create your professional profile.',
    url: '/tradeserv/register',
    siteName: 'TRADINGO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join TradeServ — Register as a Professional | TRADINGO',
    description:
      'Register on TradeServ and create your professional profile.',
  },
  alternates: {
    canonical: '/tradeserv/register',
  },
};

export default function RegisterPage() {
  return <RegisterClientPage />;
}

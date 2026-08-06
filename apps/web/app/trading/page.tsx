import type { Metadata } from 'next';
import TradingDiscoveryClient from './TradingDiscoveryClient';

export const metadata: Metadata = {
  title: 'TRADINGO Master Business Directory — Products, Companies, Industries & Cities',
  description:
    'The complete TRADINGO business directory: 160+ categories, 1,600+ sub-categories and 33,600+ products & services. Discover suppliers, industries, brands and cities across India on TRADINGO TEM E-Marketplace.',
  openGraph: {
    title: 'TRADINGO Master Business Directory',
    description:
      'Discover. Compare. Trade India — the complete TRADINGO business directory across products, services, companies, industries, brands and cities.',
    type: 'website',
  },
  alternates: {
    canonical: '/trading',
  },
};

export default function TradingPage() {
  return <TradingDiscoveryClient />;
}

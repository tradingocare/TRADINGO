import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Professional Services Categories | TradeServ by TRADINGO',
  description:
    'Browse 10 verified professional service categories on TradeServ — Chartered Accountants, GST Consultants, Company Secretaries, Trademark Consultants, Legal Advisors, Business Consultants, Brand Consultants, Export Consultants, Product Photographers, and Packaging Designers.',
  openGraph: {
    title: 'Professional Services Categories | TradeServ by TRADINGO',
    description:
      'Browse 10 verified professional service categories on TradeServ — from CAs to packaging designers.',
    url: 'https://www.tradingo.com/tradeserv/categories',
    siteName: 'TRADINGO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Professional Services Categories | TradeServ by TRADINGO',
    description:
      'Browse 10 verified professional service categories on TradeServ.',
  },
  alternates: {
    canonical: '/tradeserv/categories',
  },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

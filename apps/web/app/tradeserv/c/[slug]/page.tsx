import type { Metadata } from 'next';
import { TRADESERV_CATEGORIES as CATEGORIES } from '@/lib/data/tradeserv';
import CategoryListingClient from './category-listing-client';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return { title: 'Category Not Found — TradeServ' };
  return {
    title: `Find ${category.title}s | TradeServ by TRADINGO`,
    description: `Browse verified ${category.title.toLowerCase()} professionals on TradeServ. TRADTRUST-verified, AI-matched, and ready to help your business.`,
    openGraph: {
      title: `Find ${category.title}s | TradeServ by TRADINGO`,
      description: `Browse verified ${category.title.toLowerCase()} professionals on TradeServ.`,
      url: `/tradeserv/c/${slug}`,
      siteName: 'TRADINGO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Find ${category.title}s | TradeServ by TRADINGO`,
      description: `Browse verified ${category.title.toLowerCase()} professionals on TradeServ.`,
    },
    alternates: { canonical: `/tradeserv/c/${slug}` },
  };
}

export default function Page() {
  return <CategoryListingClient />;
}

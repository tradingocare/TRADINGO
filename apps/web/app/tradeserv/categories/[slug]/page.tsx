import type { Metadata } from 'next';
import { TRADESERV_CATEGORIES, getCategoryBySlug } from '@/lib/data/tradeserv';
import CategoryDetailClient from './client-page';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TRADESERV_CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.title} Services | TradeServ by TRADINGO`,
    description: category.detailedDescription.slice(0, 160),
    keywords: category.keywords.join(', '),
    openGraph: {
      title: `${category.title} Services | TradeServ by TRADINGO`,
      description: category.detailedDescription.slice(0, 160),
      url: `/tradeserv/categories/${slug}`,
      siteName: 'TRADINGO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.title} Services | TradeServ by TRADINGO`,
      description: category.detailedDescription.slice(0, 160),
    },
    alternates: { canonical: `/tradeserv/categories/${slug}` },
  };
}

export default function Page() {
  return <CategoryDetailClient />;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Tradegories | Browse All Business Categories | TRADINGO' },
  description:
    'Browse all business categories, subcategories, and catalog items on TRADINGO. Explore products and services across industries in one B2B marketplace.',
  openGraph: {
    title: 'Tradegories | Browse All Business Categories | TRADINGO',
    description:
      'Browse all business categories, subcategories, and catalog items on TRADINGO. Explore products and services across industries in one B2B marketplace.',
    url: '/categories',
    type: 'website',
    siteName: 'TRADINGO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tradegories | Browse All Business Categories | TRADINGO',
    description:
      'Browse all business categories, subcategories, and catalog items on TRADINGO. Explore products and services across industries in one B2B marketplace.',
  },
  alternates: {
    canonical: 'https://tradingo.in/categories',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

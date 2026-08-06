import type { Metadata } from 'next';
import { tradeservApi } from '@/lib/api/tradeserv';
import ProfileClient from './profile-client';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await tradeservApi.getProfessionalSummary(slug).catch(() => null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tradingo.com';

  if (!profile) return { title: 'Profile Not Found — TradeServ | TRADINGO' };

  const title = `${profile.name} — ${profile.professionalType || 'Professional'} | TradeServ by TRADINGO`;
  const description = profile.description?.slice(0, 160) || `Verified ${profile.professionalType || 'Professional'} on TradeServ.`;

  return {
    title,
    description,
    keywords: `${profile.name}, ${profile.professionalType || ''}, TradeServ, TRADINGO, verified professional, ${profile.locations?.[0] || ''}`,
    openGraph: {
      title: `${profile.name} — ${profile.professionalType || 'Professional'} | TradeServ`,
      description,
      url: `/tradeserv/p/${slug}`,
      siteName: 'TRADINGO',
      type: 'profile',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.name} — ${profile.professionalType || 'Professional'} | TradeServ`,
      description,
    },
    alternates: { canonical: `/tradeserv/p/${slug}` },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    other: {
      'profile:username': slug,
    },
  };
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfessionalService',
            name: 'TradeServ by TRADINGO',
            description: 'India\'s AI-Powered Business Services Platform connecting businesses with verified professionals.',
            url: 'https://www.tradingo.com/tradeserv',
            provider: {
              '@type': 'Organization',
              name: 'TRADINGO',
              url: 'https://www.tradingo.com',
            },
            areaServed: { '@type': 'Country', name: 'IN' },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Professional Services',
              itemListElement: [
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Chartered Accountant' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'GST Consultant' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Company Secretary' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Legal Advisor' } },
                { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Trademark Consultant' } },
              ],
            },
          }),
        }}
      />
      <ProfileClient />
    </>
  );
}

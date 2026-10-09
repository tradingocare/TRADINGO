import type { Metadata } from 'next';
import { tradeservApi } from '@/lib/api/tradeserv';
import ProfileClient from './profile-client';

type Props = { params: Promise<{ slug: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingo.in';

/**
 * Per-profile JSON-LD built ONLY from real profile data (ProfessionalSummary).
 * Optional fields are omitted when absent — nothing is invented
 * (no ratings without reviews, no fabricated contact/address/claims).
 */
function buildProfileJsonLd(profile: NonNullable<Awaited<ReturnType<typeof tradeservApi.getProfessionalSummary>>>) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: profile.name,
    url: `${SITE_URL}/tradeserv/p/${profile.slug}`,
  };
  if (profile.logo) ld.image = profile.logo;
  if (profile.description) ld.description = profile.description;
  if (profile.professionalType) ld.knowsAbout = [profile.professionalType];
  if (profile.locations?.length) {
    ld.areaServed = profile.locations.map((name) => ({ '@type': 'Place', name }));
  }
  if (profile.languages?.length) ld.knowsLanguage = profile.languages;
  const sameAs = profile.socialLinks ? Object.values(profile.socialLinks).filter(Boolean) : [];
  if (sameAs.length) ld.sameAs = sameAs;
  // AggregateRating only from actual review data — never fabricated.
  if (profile.reviewCount > 0 && profile.averageRating > 0) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: profile.averageRating,
      reviewCount: profile.reviewCount,
    };
  }
  return ld;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await tradeservApi.getProfessionalSummary(slug).catch(() => null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingo.in';

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

export default async function Page({ params }: Props) {
  const { slug } = await params;
  // Re-fetch via the same authoritative API used by generateMetadata so the
  // structured data reflects the real profile (graceful no-JSON-LD fallback).
  const profile = await tradeservApi.getProfessionalSummary(slug).catch(() => null);

  return (
    <>
      {profile && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProfileJsonLd(profile)) }}
        />
      )}
      <ProfileClient />
    </>
  );
}

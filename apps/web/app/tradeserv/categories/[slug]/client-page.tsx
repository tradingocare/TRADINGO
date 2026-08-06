'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { getCategoryBySlug } from '@/lib/data/tradeserv';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';

function DetailRow({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-3 transition-colors hover:border-accent/20 hover:bg-surface">
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-text-secondary">{label}</span>
    </div>
  );
}

export default function CategoryDetailClient() {
  const params = useParams();
  const slug = params.slug as string;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="text-center">
          <p className="text-6xl font-bold text-accent">404</p>
          <p className="mt-4 text-lg text-text-tertiary">Category not found</p>
          <Link
            href="/tradeserv/categories"
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm text-text-secondary transition-colors hover:border-accent/30 hover:text-text-primary"
          >
            <ArrowLeft size={16} />
            Browse all categories
          </Link>
        </div>
      </div>
    );
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'TradeServ', item: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/tradeserv` },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/tradeserv/categories` },
      { '@type': 'ListItem', position: 3, name: category.title },
    ],
  };

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${category.title} Services | TradeServ by TRADINGO`,
    description: category.detailedDescription,
    provider: {
      '@type': 'Organization',
      name: 'TRADINGO',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tradingo.com',
    },
    areaServed: { '@type': 'Country', name: 'India' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${category.title} Services`,
      itemListElement: category.benefits.map((benefit) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: benefit },
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)',
        }}
      />
      <div className="relative z-10">
        <section className="py-24 sm:py-32">
          <div className="container-main">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link
                href="/tradeserv/categories"
                className="mb-8 inline-flex items-center gap-2 text-sm text-text-tertiary transition-colors hover:text-accent"
              >
                <ArrowLeft size={14} />
                Back to all categories
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-4">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-4xl backdrop-blur-sm">
                  {category.icon}
                </span>
              </div>
              <SectionHeader
                title={category.title}
                subtitle={category.description}
              />
            </motion.div>

            <AnimatedSection>
              <div className="mx-auto mt-16 max-w-4xl">
                <div className="rounded-2xl border border-border bg-surface p-8">
                  <h2 className="text-xl font-semibold text-text-primary">About this service</h2>
                  <p className="mt-4 leading-relaxed text-text-tertiary">{category.detailedDescription}</p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="mx-auto mt-12 max-w-4xl">
                <h2 className="text-xl font-semibold text-text-primary">Key services offered</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {category.benefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/20 hover:bg-surface"
                    >
                      <CheckCircle size={18} className="mt-0.5 shrink-0 text-accent" />
                      <span className="text-sm text-text-secondary">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="mx-auto mt-12 max-w-4xl">
                <h2 className="text-xl font-semibold text-text-primary">Who needs this</h2>
                <div className="mt-6 flex flex-wrap gap-3">
                  {category.whoNeedsIt.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-tertiary transition-colors hover:border-accent/30 hover:text-text-primary"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="mx-auto mt-12 max-w-4xl">
                <h2 className="text-xl font-semibold text-text-primary">Service details</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <DetailRow label={`${category.keywords.length}+ related keywords`} icon={'\uD83D\uDD0D'} />
                  <DetailRow label="TRADTRUST-verified professionals" icon={'\u2705'} />
                  <DetailRow label="Pan-India service availability" icon={'\uD83C\uDF0F'} />
                  <DetailRow label="Direct connect without middlemen" icon={'\uD83D\uDC65'} />
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="mx-auto mt-16 max-w-4xl text-center">
                <Link
                  href="/tradeserv"
                  className="group inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-btn-primary-text transition-all duration-300 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20"
                >
                  Back to TradeServ Home
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </div>
    </>
  );
}

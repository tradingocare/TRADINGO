import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { FEATURES_SELLER, FEATURES_BUYER, FEATURES_PLATFORM, FEATURES_TRUST } from '@/data/master-data';

export const metadata: Metadata = {
  title: 'Powerful Features for Global Trade | TRADINGO',
  description:
    'Explore TRADINGO platform features — TRADBUY, RFQ, GOCASH, TRADGO, Escrow, Trade Matching, and more for sellers and buyers.',
};

const sellerFeatures = FEATURES_SELLER;

const buyerFeatures = FEATURES_BUYER;

const platformFeatures = FEATURES_PLATFORM;

const trustFeatures = FEATURES_TRUST;

export default function FeaturesPage() {
  return (
    <>
      <PageHeader
        title="Powerful Features for Global Trade"
        description="Everything you need to buy and sell across borders — from AI-powered matching to secure escrow payments."
      />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="For Sellers"
              subtitle="Grow your business with tools designed to help you list, match, and sell at scale."
            />
            <FeatureCards features={sellerFeatures} columns={3} />
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="For Buyers"
              subtitle="Source products smarter with transparent pricing, verified suppliers, and secure transactions."
            />
            <FeatureCards features={buyerFeatures} columns={3} />
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Platform Features"
              subtitle="The technology powering India's most trusted B2B trading platform."
            />
            <FeatureCards features={platformFeatures} columns={4} />
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Security & Trust"
              subtitle="Built on a foundation of security, transparency, and verified trust."
            />
            <FeatureCards features={trustFeatures} columns={3} />
          </AnimatedSection>
        </div>
      </section>

      <CTABlock
        variant="accent"
        title="Ready to get started?"
        subtitle="Join thousands of businesses already trading on TRADINGO. Create your free account today."
        primaryLabel="Create Free Account"
        primaryHref="/register"
        secondaryLabel="Explore Features"
        secondaryHref="/for-sellers"
      />
    </>
  );
}

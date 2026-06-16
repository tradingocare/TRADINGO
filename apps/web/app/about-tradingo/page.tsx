import type { Metadata } from 'next';
import { Shield, Users, Globe, Target, Eye, Heart } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { Testimonials } from '@/components/shared/testimonials';

export const metadata: Metadata = {
  title: 'About TRADINGO | India\'s First TEM™ E-Marketplace',
};

const milestones = [
  { year: '2020', title: 'The Idea Is Born', description: 'TRADINGO was conceived as a solution to the trust deficit in India\'s B2B trading ecosystem.' },
  { year: '2021', title: 'Platform Development', description: 'Months of research and development went into building the TEM™ framework and core marketplace.' },
  { year: '2022', title: 'Soft Launch', description: 'TRADINGO went live in select cities with 500+ sellers and 1,000+ product listings.' },
  { year: '2023', title: 'Pan-India Expansion', description: 'Expanded to 500+ cities. Launched GOCASH rewards and TRADGO trading races.' },
  { year: '2024', title: 'AI & Automation', description: 'Introduced AI-powered RFQ matching, price intelligence, and automated verification systems.' },
  { year: '2025', title: '50,000+ Traders', description: 'Crossed 50,000 registered traders. Launched TRADHEXA™ — six integrated trading engines.' },
];

const values = [
  {
    icon: Shield,
    title: 'Trust First',
    description: 'Every feature is built on the foundation of trust. Verified identities, escrow protection, and transparent transactions.',
  },
  {
    icon: Target,
    title: 'Innovation',
    description: 'We continuously evolve our platform with AI, gamification, and cutting-edge technology to serve our community better.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'We believe in the power of community. Every trader, buyer, and seller contributes to the TRADINGO ecosystem.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    description: 'No hidden fees, no biased algorithms, no surprises. Complete transparency in every aspect of the platform.',
  },
  {
    icon: Heart,
    title: 'Customer Success',
    description: 'Your success is our success. We provide dedicated support and tools to help every trader grow.',
  },
  {
    icon: Globe,
    title: 'Pan-India Vision',
    description: 'Connecting every corner of India through trade. Breaking down geographical barriers to create a unified marketplace.',
  },
];

const teamMembers = [
  { name: 'Arjun Nair', role: 'Founder & CEO', bio: 'Former supply chain executive with 15+ years in B2B commerce.' },
  { name: 'Priya Singh', role: 'Chief Technology Officer', bio: 'AI and marketplace platform expert. Previously led engineering at a major e-commerce firm.' },
  { name: 'Rohit Sharma', role: 'Chief Operations Officer', bio: 'Operations specialist with deep expertise in logistics and pan-India distribution networks.' },
  { name: 'Ananya Patel', role: 'Head of Product', bio: 'Product leader focused on creating intuitive trading experiences for businesses of all sizes.' },
];

const testimonialsData = [
  {
    quote: 'TRADINGO transformed our business. We went from local sales to pan-India distribution in just 3 months. The RFQ engine is a game-changer.',
    author: 'Rajesh Mehta',
    role: 'Founder',
    company: 'Mehta Enterprises, Gujarat',
    rating: 5,
  },
  {
    quote: 'The escrow system gave us the confidence to trade with new partners. GOCASH rewards actually offset our platform costs significantly.',
    author: 'Priya Sharma',
    role: 'Procurement Head',
    company: 'Sharma Industries, Rajasthan',
    rating: 5,
  },
  {
    quote: 'As a small manufacturer, getting visibility was always a challenge. TRADINGO put us on the map. We now supply to 15+ cities.',
    author: 'Amit Verma',
    role: 'Owner',
    company: 'Verma Fabrics, Maharashtra',
    rating: 4,
  },
];

export default function AboutTradingoPage() {
  return (
    <>
      <PageHeader
        title="About TRADINGO"
        description="India's first TEM™ (Trusted Electronic Marketplace) connecting buyers and sellers through trust, technology, and transparent trading."
      />

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container-main">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
            <AnimatedSection>
              <div className="rounded-xl border border-border bg-surface p-8 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <Target className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">Our Mission</h2>
                <p className="mt-4 text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                  To democratize B2B trading in India by creating a trusted, technology-driven marketplace where
                  every business — from small manufacturers to large enterprises — can trade with confidence,
                  transparency, and efficiency.
                </p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={150}>
              <div className="rounded-xl border border-border bg-surface p-8 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
                  <Eye className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">Our Vision</h2>
                <p className="mt-4 text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                  To become India&apos;s most trusted trading ecosystem — connecting every city, every industry, and
                  every business on a single platform powered by trust, AI, and community-driven rewards.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Separator />

      {/* Story */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-3xl text-center">
              <SectionHeader
                title="Our Story"
                subtitle="How TRADINGO went from an idea to India's first TEM™ E-Marketplace."
              />
              <div className="space-y-6 text-left text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                <p>
                  TRADINGO was born in 2020 out of a simple observation: India&apos;s B2B trading ecosystem was fragmented,
                  trust-deficient, and inefficient. Small manufacturers struggled to find buyers. Suppliers had no way to
                  verify the credibility of trading partners. Every transaction carried risk.
                </p>
                <p>
                  Our founder, Arjun Nair, experienced these challenges firsthand during his decade-long career in supply
                  chain management. He envisioned a platform that could solve the trust problem at its core — not just by
                  connecting buyers and sellers, but by creating a system where trust was built into every transaction.
                </p>
                <p>
                  That vision became TEM™ — the Trusted Electronic Marketplace framework. Unlike traditional e-commerce
                  marketplaces, TEM™ combines verified identities, escrow-protected payments, AI-powered matching, and a
                  rewards ecosystem into a single, unified trading experience.
                </p>
                <p>
                  Today, TRADINGO serves over 50,000 traders across 500+ cities, with thousands of products listed across
                  dozens of categories. But we&apos;re just getting started. Our mission is to connect every business in
                  India through trust and technology.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      {/* Team / Values */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Our Values"
            subtitle="The principles that guide everything we build at TRADINGO."
          />
          <FeatureCards features={values} columns={3} />
        </div>
      </section>

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="Meet Our Team"
            subtitle="The people behind TRADINGO."
            align="center"
          />
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
            {teamMembers.map((member, i) => (
              <AnimatedSection key={member.name} delay={i * 100}>
                <div className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-200">
                    <span className="text-lg font-bold">{member.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">{member.name}</h3>
                  <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{member.role}</p>
                  <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">{member.bio}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Timeline */}
      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Our Journey"
            subtitle="Key milestones in TRADINGO's growth story."
          />
          <div className="mx-auto max-w-3xl">
            {milestones.map((m, i) => (
              <AnimatedSection key={m.year} delay={i * 100}>
                <div className="relative flex gap-6 pb-12 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                      {m.year.slice(2)}
                    </div>
                    {i < milestones.length - 1 && (
                      <div className="mt-2 w-px flex-1 bg-border dark:bg-dark-border" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">{m.year}</p>
                    <h3 className="mt-1 text-lg font-semibold text-text-primary dark:text-dark-text-primary">{m.title}</h3>
                    <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{m.description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Testimonials */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <SectionHeader
            title="What Our Traders Say"
            subtitle="Real stories from the TRADINGO community."
          />
          <Testimonials testimonials={testimonialsData} />
        </div>
      </section>

      <Separator />

      {/* CTA */}
      <CTABlock
        title="Join TRADINGO"
        subtitle="Be part of India's fastest-growing B2B trading ecosystem. Create your free account today."
        primaryLabel="Create Free Account"
        primaryHref="/register"
        secondaryLabel="Explore Marketplace"
        secondaryHref="/trading"
        variant="accent"
      />
    </>
  );
}

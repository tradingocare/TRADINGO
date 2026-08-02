import Link from 'next/link';
import {
  MessageCircle, Users, Building2, Handshake, Globe, Star, Lightbulb,
  Shield, Award, TrendingUp, Zap, Lock, ArrowRight, CheckCircle,
  Sparkles, Network, Target, Rocket, LogIn, ChevronDown,
} from 'lucide-react';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { Accordion } from '@/components/ui/accordion';
import type { LucideIcon } from 'lucide-react';

const BENEFITS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Network, title: 'Business Networking', desc: 'Connect with verified businesses across India\'s largest B2B ecosystem.' },
  { icon: Building2, title: 'Supplier Discovery', desc: 'Discover reliable suppliers vetted by the TRADINGO Trust Network.' },
  { icon: Users, title: 'Buyer Connections', desc: 'Find genuine buyers looking for your products and services.' },
  { icon: Handshake, title: 'Business Collaboration', desc: 'Form strategic partnerships and joint ventures with trusted partners.' },
  { icon: Globe, title: 'Industry Communities', desc: 'Join industry-specific communities for manufacturing, exports, retail, and more.' },
  { icon: Star, title: 'Business Referrals', desc: 'Share and receive qualified business referrals within the community.' },
  { icon: Lightbulb, title: 'Knowledge Sharing', desc: 'Exchange insights, market intelligence, and industry best practices.' },
  { icon: Award, title: 'Growth Opportunities', desc: 'Access exclusive business opportunities shared only within the community.' },
  { icon: Zap, title: 'AI-Powered Networking', desc: 'Smart matchmaking powered by AI to connect you with the right businesses.' },
  { icon: Shield, title: 'Trust-Based Access', desc: 'Every member is verified through TRADINGO\'s TradTrust scoring system.' },
  { icon: TrendingUp, title: 'Market Intelligence', desc: 'Stay ahead with community-driven market trends and demand signals.' },
  { icon: Target, title: 'Business Expansion', desc: 'Expand into new cities and sectors through community connections.' },
];

const FEATURE_GROUPS: { category: string; features: { icon: LucideIcon; title: string; desc: string }[] }[] = [
  {
    category: 'Networking',
    features: [
      { icon: Users, title: 'Verified Member Directory', desc: 'Browse and connect with verified businesses by industry, location, and expertise.' },
      { icon: Handshake, title: 'Smart Introductions', desc: 'AI-powered matchmaking suggests relevant business connections based on your profile.' },
      { icon: Globe, title: 'Industry Communities', desc: 'Dedicated spaces for manufacturing, exports, retail, logistics, and more.' },
    ],
  },
  {
    category: 'Collaboration',
    features: [
      { icon: Target, title: 'Business Opportunities', desc: 'Post and discover collaboration opportunities within the trusted network.' },
      { icon: Star, title: 'Referral Exchange', desc: 'Share qualified leads and earn rewards when referrals convert.' },
      { icon: Award, title: 'Joint Ventures', desc: 'Find complementary businesses for projects, tenders, and market expansion.' },
    ],
  },
  {
    category: 'Trust & Safety',
    features: [
      { icon: Shield, title: 'TradTrust Verified', desc: 'Every member is verified through TRADINGO\'s multi-level trust scoring.' },
      { icon: Lock, title: 'Invite-Only Access', desc: 'Quality-controlled membership ensures a community of genuine businesses.' },
      { icon: CheckCircle, title: 'Professional Conduct', desc: 'Clear community guidelines enforced to maintain a professional environment.' },
    ],
  },
  {
    category: 'AI Ready',
    features: [
      { icon: Sparkles, title: 'AI Matchmaking', desc: 'Our AI suggests relevant connections, opportunities, and communities for you.' },
      { icon: MessageCircle, title: 'Smart Discussions', desc: 'AI-moderated discussions surface the most relevant insights for your business.' },
      { icon: TrendingUp, title: 'Trend Intelligence', desc: 'AI analyzes community activity to identify emerging business trends and demands.' },
    ],
  },
];

const COMMUNITY_PREVIEWS = [
  { title: 'Manufacturing Leaders', desc: 'Connect with India\'s top manufacturers across automotive, electronics, textiles, and more.', color: 'from-blue-500/20' },
  { title: 'Export Community', desc: 'Network with exporters, freight forwarders, and trade compliance experts.', color: 'from-emerald-500/20' },
  { title: 'Retail Network', desc: 'India\'s retail chain owners, distributors, and D2C brand founders.', color: 'from-purple-500/20' },
  { title: 'MSME Growth Circle', desc: 'Support network for micro, small, and medium enterprise owners.', color: 'from-amber-500/20' },
  { title: 'Logistics Forum', desc: 'Freight, warehousing, and supply chain professionals discussing industry challenges.', color: 'from-cyan-500/20' },
  { title: 'Startup Founders', desc: 'B2B startup founders sharing growth strategies, fundraising insights, and partnerships.', color: 'from-pink-500/20' },
];

const STATS = [
  { label: 'Verified Partners', value: 'Coming Soon' },
  { label: 'Communities', value: 'Coming Soon' },
  { label: 'Industry Rooms', value: 'Coming Soon' },
  { label: 'Business Connections', value: 'Coming Soon' },
  { label: 'Cities', value: 'Coming Soon' },
  { label: 'Discussions', value: 'Coming Soon' },
];

const ROADMAP = [
  { icon: Sparkles, title: 'AI Community', desc: 'AI-powered networking and matchmaking' },
  { icon: Award, title: 'Founder Club', desc: 'Exclusive circle for business founders and CXOs' },
  { icon: Globe, title: 'Industry Events', desc: 'Virtual and in-person networking events' },
  { icon: MessageCircle, title: 'Business Forums', desc: 'Topic-based business discussion forums' },
  { icon: Target, title: 'Business Opportunities', desc: 'Post and discover collaboration opportunities' },
  { icon: Lightbulb, title: 'Knowledge Hub', desc: 'Curated business resources and market reports' },
  { icon: Users, title: 'Mentorship', desc: 'Connect with experienced industry mentors' },
  { icon: Star, title: 'Expert Panels', desc: 'Industry expert Q&A and panel discussions' },
  { icon: Zap, title: 'AI Discussions', desc: 'Smart AI-moderated business conversations' },
];

const FAQS = [
  { q: 'What is TradeTalk?', a: 'TradeTalk is the official Business Community module of the TRADINGO ecosystem. It is a professional networking platform where verified businesses, suppliers, buyers, and service providers connect, collaborate, and grow together.' },
  { q: 'Who can join TradeTalk?', a: 'TradeTalk is exclusively for TRADINGO Verified Partners. Membership requires an active TRADINGO account with verified business credentials through our TradTrust verification system.' },
  { q: 'How is TradeTalk different from LinkedIn?', a: 'Unlike general social networks, TradeTalk is purpose-built for B2B commerce. Every member is a verified business entity. There is no noise, no spam, no personal content — only professional business networking with real commercial intent.' },
  { q: 'Is TradeTalk free?', a: 'TradeTalk is available as a premium add-on to TRADINGO Verified Partners. Annual membership is INR 11,999 + GST. This ensures the community remains exclusive, high-quality, and spam-free.' },
  { q: 'Can I join multiple communities?', a: 'Yes. TradeTalk members can join multiple industry communities based on their business interests, sectors served, and geographic presence.' },
  { q: 'How does TRADINGO verify members?', a: 'All members are verified through our TradTrust scoring system, which evaluates business credentials, GST/PAN validation, trade history, and peer reviews. Only businesses meeting our verification threshold can join TradeTalk.' },
  { q: 'When will TradeTalk launch?', a: 'TradeTalk is currently under development. The community features, AI matchmaking, and discussion forums will roll out in phases. Stay tuned for launch announcements.' },
];

const GUIDELINES = [
  'Maintain professional conduct in all interactions',
  'No spam, unsolicited promotions, or fake leads',
  'Respect member confidentiality and business data',
  'Follow ethical business practices at all times',
  'Only verified businesses are eligible for membership',
  'Report any suspicious or unprofessional behaviour',
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
      {children}
    </span>
  );
}

function SectionWrapper({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`border-t border-border px-4 py-20 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function IconBox({ icon: Icon, size = 'md' }: { icon: LucideIcon; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'h-9 w-9 rounded-lg', md: 'h-10 w-10 rounded-lg', lg: 'h-12 w-12 rounded-xl' };
  const iconSizeMap = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };
  return (
    <div className={`flex items-center justify-center ${sizeMap[size]} bg-accent/10 text-accent`}>
      <Icon className={iconSizeMap[size]} />
    </div>
  );
}

export default function TradeTalkPage() {
  return (
    <>
      {/* ── Glow Background ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-1/4 -top-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-accent/5 via-accent/3 to-transparent blur-[140px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-l from-accent/5 via-accent/3 to-transparent blur-[140px]" />
      </div>

      {/* 1. Hero */}
      <section className="relative z-10 overflow-hidden px-4 pb-12 pt-24 sm:pt-32">
        <div className="container-main">
          <div className="glass-card-lg mx-auto max-w-4xl p-8 text-center sm:p-12">
            <Pill>Coming Soon</Pill>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-gradient">TradeTalk</span>
              <sup className="-top-6 ml-1 text-[10px] font-normal text-text-tertiary">TM</sup>
            </h1>
            <p className="mt-3 text-base text-accent/70 sm:text-lg">
              Business Community
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
              India&apos;s Exclusive Business Community for TRADINGO Verified Partners.
              <br />
              <span className="text-text-primary">Network. Collaborate. Grow.</span>
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-btn-primary-text transition-all hover:bg-accent/90"
              >
                <LogIn className="h-4 w-4" /> Join TRADINGO
              </Link>
              <Link
                href="/tradeserv"
                className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-medium text-text-secondary transition-all hover:bg-surface"
              >
                Explore TradeServ <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-text-tertiary">
              <Link href="#about" className="hover:text-accent transition-colors">What is TradeTalk?</Link>
              <Link href="#features" className="hover:text-accent transition-colors">Features</Link>
              <Link href="#membership" className="hover:text-accent transition-colors">Membership</Link>
              <Link href="#faq" className="hover:text-accent transition-colors">FAQ</Link>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* 2. About */}
      <SectionWrapper id="about">
        <AnimatedSection>
          <div className="mx-auto max-w-4xl text-center">
            <Pill>About</Pill>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl text-text-primary">What is TradeTalk?</h2>
            <p className="mt-4 text-lg text-text-secondary leading-relaxed">
              TradeTalk is the official Business Community module of the TRADINGO ecosystem. It is a
              professional networking platform designed exclusively for verified businesses, suppliers,
              buyers, and service providers to connect, collaborate, and grow together.
            </p>
            <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
              {[
                { title: 'Invite-Only Quality', desc: 'Unlike public social networks, TradeTalk is invite-only for TRADINGO Verified Partners. Every member is a genuine business entity verified through TradTrust.' },
                { title: 'Purpose-Built for B2B', desc: 'No personal content, no noise, no spam. Every interaction has commercial intent — supplier discovery, business referrals, collaboration, and knowledge sharing.' },
                { title: 'AI-Ready Architecture', desc: 'Built on TRADINGO\'s AI Gateway, TradeTalk will feature smart matchmaking, trend intelligence, and AI-moderated discussions from day one.' },
              ].map((item) => (
                <div key={item.title} className="surface-card-lg p-6">
                  <h3 className="font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </SectionWrapper>

      <Separator />

      {/* 3. Benefits */}
      <SectionWrapper>
        <SectionHeader
          title="Why TradeTalk?"
          subtitle="Everything you need to grow your business network"
        />
        <AnimatedSection>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="group surface-card p-5 transition-all duration-300 hover:border-accent/20 hover:shadow-lg hover:-translate-y-0.5"
              >
                <IconBox icon={benefit.icon} size="sm" />
                <h3 className="mt-3 text-sm font-semibold text-text-primary">{benefit.title}</h3>
                <p className="mt-1 text-xs text-text-secondary leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </SectionWrapper>

      <Separator />

      {/* 4. Features */}
      <SectionWrapper id="features">
        <SectionHeader
          title="Features"
          subtitle="Enterprise-grade networking capabilities built for business"
        />
        <div className="mt-10 space-y-12">
          {FEATURE_GROUPS.map((group) => (
            <AnimatedSection key={group.category}>
              <div>
                <Pill>{group.category}</Pill>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.features.map((feature) => (
                    <div
                      key={feature.title}
                      className="surface-card-lg p-6 transition-all duration-300 hover:border-accent/20 hover:shadow-lg"
                    >
                      <IconBox icon={feature.icon} />
                      <h3 className="mt-4 font-semibold text-text-primary">{feature.title}</h3>
                      <p className="mt-2 text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </SectionWrapper>

      <Separator />

      {/* 5. Community Preview (Locked) */}
      <SectionWrapper>
        <SectionHeader
          title="Communities"
          subtitle="Preview of communities coming to TradeTalk"
        />
        <AnimatedSection>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COMMUNITY_PREVIEWS.map((community) => (
              <div
                key={community.title}
                className="group relative overflow-hidden surface-card-lg p-6"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${community.color} to-transparent opacity-30 blur-xl`} />
                <div className="absolute inset-0 backdrop-blur-[3px]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <Lock className="h-5 w-5 text-amber-400" />
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                      LOCKED
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold text-text-primary">{community.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{community.desc}</p>
                  <div className="mt-3 text-[10px] font-medium uppercase tracking-wider text-amber-400">
                    Coming Soon
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </SectionWrapper>

      <Separator />

      {/* 6. Statistics */}
      <SectionWrapper>
        <SectionHeader
          title="Community in Numbers"
          subtitle="Real-time community metrics — coming soon"
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="glass-card-lg p-5 text-center">
              <p className="text-lg font-bold text-text-tertiary">{stat.value}</p>
              <p className="mt-1 text-xs text-text-tertiary">{stat.label}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      <Separator />

      {/* 7. Membership */}
      <SectionWrapper id="membership">
        <AnimatedSection>
          <div className="mx-auto max-w-3xl text-center">
            <Pill>Membership</Pill>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl text-text-primary">TradeTalk Membership</h2>
            <p className="mt-4 text-text-secondary">
              Annual membership for TRADINGO Verified Partners
            </p>
            <div className="mt-8 surface-card-xl mx-auto max-w-md p-8">
              <p className="text-sm text-text-tertiary">Annual Plan</p>
              <p className="mt-2 text-4xl font-bold text-text-primary">
                &#x20B9;11,999
                <span className="text-base font-normal text-text-tertiary"> + GST</span>
              </p>
              <p className="mt-1 text-sm text-text-tertiary">per year</p>
              <div className="mt-6 space-y-3 text-left">
                {[
                  'Access to all industry communities',
                  'AI-powered business matchmaking',
                  'Verified member directory',
                  'Business referral exchange',
                  'Community events and discussions',
                  'Priority support',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl bg-surface-secondary p-4 text-xs text-text-tertiary">
                Only available for TRADINGO Verified Partners. Membership purchase will be available at launch.
              </div>
            </div>
          </div>
        </AnimatedSection>
      </SectionWrapper>

      <Separator />

      {/* 8. Roadmap */}
      <SectionWrapper>
        <SectionHeader
          title="Future Roadmap"
          subtitle="What&apos;s coming to TradeTalk"
        />
        <AnimatedSection>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROADMAP.map((item) => (
              <div key={item.title} className="surface-card p-5 transition-all duration-300 hover:border-accent/20 hover:shadow-lg">
                <IconBox icon={item.icon} size="sm" />
                <h3 className="mt-3 text-sm font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-1 text-xs text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </SectionWrapper>

      <Separator />

      {/* 9. FAQ */}
      <SectionWrapper id="faq">
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about TradeTalk"
        />
        <div className="mx-auto mt-10 max-w-3xl">
          <Accordion
            items={FAQS.map((faq, i) => ({
              value: `faq-${i}`,
              title: faq.q,
              children: <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>,
            }))}
            type="multiple"
          />
        </div>
      </SectionWrapper>

      <Separator />

      {/* 10. Community Guidelines */}
      <SectionWrapper>
        <SectionHeader
          title="Community Guidelines"
          subtitle="Our commitment to professional, respectful business networking"
        />
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="grid gap-3 sm:grid-cols-2">
            {GUIDELINES.map((guideline) => (
              <div key={guideline} className="flex items-start gap-3 surface-card p-4">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-sm text-text-secondary">{guideline}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      <Separator />

      {/* 11. CTA */}
      <section className="border-t border-border px-4 py-20 sm:py-24">
        <div className="container-main">
          <div className="mx-auto max-w-4xl text-center">
            <div className="glass-card-xl p-8 sm:p-12">
              <MessageCircle className="mx-auto h-12 w-12 text-accent" />
              <h2 className="mt-6 text-3xl font-bold sm:text-4xl text-text-primary">
                Where Verified Businesses Connect,
                <br />
                <span className="text-gradient">Collaborate &amp; Grow Together</span>
              </h2>
              <p className="mt-4 text-lg text-text-secondary">
                Be part of India&apos;s most exclusive B2B business community.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-btn-primary-text transition-all hover:bg-accent/90"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/tradeserv"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-medium text-text-secondary transition-all hover:bg-surface"
                >
                  Learn About TradeServ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

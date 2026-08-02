import Link from 'next/link';
import {
  Shield, Bot, Award, ArrowRight, ChevronRight, LogIn, Search, CheckCircle, Star,
  User, Users, Building2, Briefcase, BarChart3, MessageSquare, CreditCard, Globe, Sparkles,
  Wallet, Target, Lightbulb, TrendingUp, Layers, ChevronDown,
} from 'lucide-react';
import { TRADESERV_CATEGORIES } from '@/lib/data/tradeserv';
import { CatalogEnrichmentBadge } from '@/components/tradeserv/catalog-enrichment-badge';

const FAQ_ITEMS = [
  { q: 'What is TradeServ?', a: 'TradeServ is TRADINGO\'s marketplace for professional services — connecting businesses with verified chartered accountants, GST consultants, company secretaries, and other business service professionals.' },
  { q: 'How do I register as a professional?', a: 'Click "Register as Professional" on the TradeServ landing page, fill in your credentials, upload verification documents, and complete your profile. Your listing goes live once verified.' },
  { q: 'How does pricing work for professionals?', a: 'TradeServ offers Individual (?2,499/yr + GST) and Company (?5,999/yr + GST) plans. Both include a 14-day free trial with no credit card required.' },
  { q: 'Can businesses browse professionals without registering?', a: 'Yes. Businesses can search, view profiles, and read reviews on TradeServ public pages without creating an account. Contact and booking require free registration.' },
  { q: 'How are professionals verified?', a: 'Every professional undergoes document verification, qualification checks, and practice license validation before their profile goes live on TradeServ.' },
];

const TRUST_BADGES = [
  {
    icon: Bot,
    title: 'AI Matching',
    description: 'Smart algorithms connect you with the right professional based on your business needs, industry, and budget.',
  },
  {
    icon: Shield,
    title: 'TRADTRUST Verified',
    description: 'Every professional\'s credentials, certifications, and track record are independently validated.',
  },
  {
    icon: Wallet,
    title: 'GOCASH Rewards',
    description: 'Earn GOCASH rewards on every engagement. Redeem for membership, services, and platform benefits.',
  },
];

const PROBLEMS_BUSINESS = [
  'Finding trusted professionals takes weeks of research and referrals',
  'No way to verify credentials, track record, or reliability',
  'Pricing is opaque ? no standard benchmarks for services',
  'Quality varies wildly with no accountability mechanism',
  'Communication is fragmented across email, phone, WhatsApp',
  'No centralized platform to manage multiple professional relationships',
];

const PROBLEMS_PROFESSIONAL = [
  'Client acquisition depends entirely on referrals and network',
  'No platform to showcase credentials and past work',
  'Pricing negotiation happens in a vacuum without market data',
  'Payment collection is manual, delayed, and unpredictable',
  'No systematic way to collect and display client reviews',
  'Admin work consumes time that could be spent serving clients',
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Professional Identity',
    desc: 'Professionals create a detailed profile with credentials, certifications, experience, and portfolio. Every claim is verified.',
    icon: User,
  },
  {
    step: 2,
    title: 'TRADTRUST Verification',
    desc: 'Documents, licenses, and qualifications are independently verified. A TradTrust score is calculated based on 6 dimensions.',
    icon: Shield,
  },
  {
    step: 3,
    title: 'AI Discovery',
    desc: 'Buyers find the right professional through AI-powered search, smart filters, and personalized recommendations.',
    icon: Bot,
  },
  {
    step: 4,
    title: 'Business Connects',
    desc: 'Send inquiries, receive proposals, negotiate terms, and accept quotes ? all within a single platform.',
    icon: MessageSquare,
  },
  {
    step: 5,
    title: 'Grow Together',
    desc: 'After engagement, leave verified reviews, build your reputation, and earn GOCASH rewards for every completed project.',
    icon: TrendingUp,
  },
];

const WHY_TRUST = [
  { icon: Bot, title: 'AI Matching', desc: 'Our algorithms analyze your requirements, industry, budget, and location to find the most suitable professionals ? not just the first page of search results.' },
  { icon: Shield, title: 'TRADTRUST Scoring', desc: 'Every professional has a TradTrust score based on profile completeness, document verification, review ratings, response rate, and membership tier.' },
  { icon: Star, title: 'Verified Reviews', desc: 'Every review is linked to a verified engagement. No fake reviews. No anonymous ratings. Clients must have worked with the professional to leave a review.' },
  { icon: Briefcase, title: 'Business Focus', desc: 'TradeServ is built exclusively for business services ? audit, legal, consulting, design, compliance. No freelancer gigs, no consumer services.' },
  { icon: MessageSquare, title: 'Secure Communication', desc: 'All communication between buyers and professionals stays within the platform. Built-in messaging with read receipts and file sharing.' },
  { icon: CreditCard, title: 'Escrow (Coming Soon)', desc: 'Future escrow-based payment protection ensures professionals get paid and buyers get what they paid for.' },
];

const COMING_FEATURES = [
  { icon: User, title: 'Professional Profiles', desc: 'Rich profiles with credentials, portfolio, certifications, and client reviews ? all verified.' },
  { icon: Search, title: 'Business Discovery', desc: 'Search, filter, and discover professionals by category, location, rating, and TradTrust score.' },
  { icon: Bot, title: 'AI Smart Search', desc: 'Natural language search that understands your business needs and finds the right match.' },
  { icon: Sparkles, title: 'AI Matching', desc: 'Automated matching based on requirements, budget, timeline, and past engagement patterns.' },
  { icon: Award, title: 'Membership', desc: 'Professional plans with enhanced profiles, priority support, and AI matching boost.' },
  { icon: Users, title: 'CRM', desc: 'Built-in lead management for professionals to track inquiries, proposals, and client relationships.' },
  { icon: Target, title: 'Lead Management', desc: 'Inquiry pipeline with status tracking, response templates, and conversion analytics.' },
  { icon: BarChart3, title: 'Business Dashboard', desc: 'Real-time analytics on profile views, search appearances, inquiries, and revenue.' },
];

export default function TradeServPage() {
  return (
    <div className="min-h-screen">
      {/* --- HERO --- */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center sm:pt-32 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-accent/3 blur-[140px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-accent/2 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            TradeServ<sup className="ml-1 text-lg font-normal text-text-tertiary align-super">&trade;</sup>
          </h1>
          <p className="mb-3 text-xl font-medium text-accent sm:text-2xl">
            India&apos;s AI-Powered Business Services Platform
          </p>
          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-text-secondary">
            Helping businesses discover trusted professionals, consultants, agencies and business experts through AI and TRADTRUST.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/tradeserv/search"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-btn-primary-text transition-all hover:bg-accent/90 hover:shadow-[0_0_25px_var(--glow)]"
              style={{ '--glow': 'color-mix(in srgb, var(--accent) 30%, transparent)' } as React.CSSProperties}
            >
              <Search className="h-4 w-4" />
              Explore Professionals
            </Link>
            <Link
              href="/tradeserv/register"
              className="group inline-flex items-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-semibold text-text-primary transition-all hover:border-border hover:bg-surface"
            >
              Register as Professional
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/tradeserv/categories"
              className="inline-flex items-center gap-1.5 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
            >
              <Layers className="h-3.5 w-3.5" />
              Browse Categories
            </Link>
            <Link
              href="/tradeserv/p/rahul-sharma-ca"
              className="inline-flex items-center gap-1.5 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
            >
              <User className="h-3.5 w-3.5" />
              Sample Profile
            </Link>
            <Link
              href="/tradeserv/workspace/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
            >
              <LogIn className="h-3.5 w-3.5" />
              Professional Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* --- TRUST BADGES --- */}
      <section className="border-t border-border px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            {TRUST_BADGES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group surface-card p-6 transition-all hover:border-border hover:bg-surface"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
                <p className="text-sm leading-relaxed text-text-tertiary">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- WHY TRADESERV --- */}
      <section className="border-t border-border px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">Why TradeServ</h2>
            <p className="mx-auto max-w-2xl text-base text-text-tertiary">
              The platform built to solve real problems for both businesses and professionals.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* Business Problems */}
            <div className="surface-card-lg p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <Target className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Business Problems</h3>
              </div>
              <ul className="space-y-3">
                {PROBLEMS_BUSINESS.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-text-tertiary">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/60" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Professional Problems */}
            <div className="surface-card-lg p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Professional Problems</h3>
              </div>
              <ul className="space-y-3">
                {PROBLEMS_PROFESSIONAL.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-text-tertiary">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Solution Summary */}
          <div className="mt-10 rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-text-primary">TradeServ Solves Both Sides</h3>
            <p className="mx-auto max-w-3xl text-sm leading-relaxed text-text-tertiary">
              Businesses get a verified marketplace with AI-powered discovery, transparent pricing, and secure communication.
              Professionals get a complete business platform with client acquisition, CRM, proposal management, and reputation building.
              Every engagement builds trust through TRADTRUST scoring and verified reviews.
            </p>
          </div>
        </div>
      </section>

      {/* --- HOW TRADESERV WORKS --- */}
      <section className="border-t border-border px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">How TradeServ Works</h2>
            <p className="mx-auto max-w-2xl text-base text-text-tertiary">
              From professional onboarding to engagement and growth ? a complete lifecycle.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-accent/40 via-accent/10 to-transparent md:block" />
            <div className="space-y-12">
              {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }) => (
                <div key={step} className="relative flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
                  <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 md:ml-0">
                    <Icon className="h-7 w-7 text-accent" />
                    <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-btn-primary-text">
                      {step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
                    <p className="max-w-xl text-sm leading-relaxed text-text-tertiary">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- ALL CATEGORIES --- */}
      <section className="border-t border-border px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">Professional Categories</h2>
            <p className="mx-auto max-w-2xl text-base text-text-tertiary">
              Find verified professionals across 10 business service categories.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {TRADESERV_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/tradeserv/c/${cat.slug}`}
                className="group surface-card p-5 transition-all hover:border-border hover:bg-surface"
              >
                <div className="mb-3 text-2xl">{cat.icon}</div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary transition-colors group-hover:text-accent">
                    {cat.title}
                  </h3>
                  <CatalogEnrichmentBadge categoryTitle={cat.title} />
                </div>
                <p className="text-xs leading-relaxed text-text-tertiary line-clamp-2">
                  {cat.shortDescription}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/tradeserv/categories"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-btn-primary-text transition-all hover:bg-accent/90 hover:shadow-[0_0_25px_var(--glow)]"
              style={{ '--glow': 'color-mix(in srgb, var(--accent) 30%, transparent)' } as React.CSSProperties}
            >
              Explore All Categories
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/tradeserv/register"
              className="group inline-flex items-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-semibold text-text-primary transition-all hover:border-border hover:bg-surface"
            >
              Register as Professional
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- WHY BUSINESSES TRUST TRADESERV --- */}
      <section className="border-t border-border px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">Why Businesses Trust TradeServ</h2>
            <p className="mx-auto max-w-2xl text-base text-text-tertiary">
              Built specifically for business services with trust at every layer.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_TRUST.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="surface-card p-6 transition-all hover:border-border">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-text-primary">{title}</h3>
                <p className="text-sm leading-relaxed text-text-tertiary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- EVERYTHING COMING TO TRADESERV --- */}
      <section className="border-t border-border px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">Everything Coming to TradeServ</h2>
            <p className="mx-auto max-w-2xl text-base text-text-tertiary">
              A complete platform ecosystem for business services.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMING_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="surface-card p-5 transition-all hover:border-border">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-text-primary">{title}</h3>
                <p className="text-xs leading-relaxed text-text-tertiary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MEMBERSHIP PLANS --- */}
      <section className="border-t border-border px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">Membership Plans</h2>
            <p className="mx-auto max-w-2xl text-base text-text-tertiary">
              Choose the right plan for your professional practice. All plans include TRADTRUST verification.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {/* Individual Plan */}
            <div className="surface-card-lg p-8 transition-all hover:border-border">
              <div className="mb-6">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <User className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Individual</h3>
                <p className="mt-1 text-sm text-text-tertiary">For solo practitioners and independent consultants</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-text-primary">?2,499</span>
                <span className="ml-1 text-sm text-text-tertiary">+ GST</span>
                <p className="mt-1 text-xs text-text-tertiary">per year</p>
              </div>
              <ul className="mb-8 space-y-2.5">
                {[
                  'Professional profile with credentials',
                  'Up to 3 service listings',
                  'TRADTRUST verification',
                  'AI-powered search visibility',
                  'Inquiry management',
                  'Basic analytics dashboard',
                  'Standard support',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tradeserv/register"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text-primary transition-all hover:bg-surface"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Company Plan */}
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8 transition-all hover:border-accent/50">
              <div className="mb-6">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Company</h3>
                <p className="mt-1 text-sm text-text-tertiary">For firms, agencies, and multi-professional practices</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-text-primary">?5,999</span>
                <span className="ml-1 text-sm text-text-tertiary">+ GST</span>
                <p className="mt-1 text-xs text-text-tertiary">per year</p>
              </div>
              <ul className="mb-8 space-y-2.5">
                {[
                  'Company profile with team members',
                  'Unlimited service listings',
                  'TRADTRUST verification for all team members',
                  'Priority AI matching boost',
                  'Full inquiry & proposal management',
                  'Advanced analytics & reporting',
                  'Priority support & dedicated account manager',
                  'CRM integration with lead pipeline',
                  'Featured in search results',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tradeserv/register"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-btn-primary-text transition-all hover:bg-accent/90"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-text-tertiary">
              All plans include a 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="border-t border-border px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-text-primary sm:text-4xl">Frequently Asked Questions</h2>
            <p className="mx-auto max-w-2xl text-base text-text-tertiary">
              Everything you need to know about TradeServ.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }) => (
              <details key={q} className="group surface-card transition-all open:border-accent/20 open:bg-accent/[0.02]">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-text-primary transition-colors hover:text-accent">
                  {q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-text-tertiary transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-sm leading-relaxed text-text-tertiary">{a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="border-t border-border px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-text-primary sm:text-4xl">Join the Future of Business Services</h2>
          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-text-tertiary">
            Whether you&apos;re a business looking for trusted professionals or a professional
            building your practice, TradeServ gives you the platform, trust, and tools to grow.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/tradeserv/register"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-btn-primary-text transition-all hover:bg-accent/90 hover:shadow-[0_0_25px_var(--glow)]"
              style={{ '--glow': 'color-mix(in srgb, var(--accent) 30%, transparent)' } as React.CSSProperties}
            >
              Register as Professional
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/tradeserv/categories"
              className="group inline-flex items-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm font-semibold text-text-primary transition-all hover:border-border hover:bg-surface"
            >
              Explore Categories
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <Link href="/tradeserv/search" className="text-xs text-text-tertiary transition-colors hover:text-text-secondary underline underline-offset-2">
              Professional Search
            </Link>
            <Link href="/tradeserv/p/rahul-sharma-ca" className="text-xs text-text-tertiary transition-colors hover:text-text-secondary underline underline-offset-2">
              Sample Public Profile
            </Link>
            <Link href="/tradeserv/workspace/dashboard" className="text-xs text-text-tertiary transition-colors hover:text-text-secondary underline underline-offset-2">
              Professional Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 text-center">
          <p className="text-xs text-text-tertiary">
            Powered by{' '}
            <span className="font-semibold text-text-tertiary">TRADINGO</span>
            <span className="mx-1.5 text-text-tertiary">|</span>
            <span className="font-semibold text-text-tertiary">TRADHEXA</span>
            <sup className="ml-0.5 text-[9px] text-text-tertiary/50">&trade;</sup>
          </p>
          <p className="text-[10px] text-text-tertiary">
            Part of Niksa Global Ventures Pvt. Ltd.
          </p>
        </div>
      </footer>
    </div>
  );
}


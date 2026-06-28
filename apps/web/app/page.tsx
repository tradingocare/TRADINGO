import type { Metadata } from 'next';
import HeroSection from '@/components/sections/HeroSection';
import TradingAcrossBorders from '@/components/sections/TradingAcrossBorders';
import IndiaHubs from '@/components/sections/IndiaHubs';
import TradhexaEngines from '@/components/sections/TradhexaEngines';
import AboutTradingo from '@/components/sections/AboutTradingo';
import { Separator } from '@/components/ui/separator';
import BusinessCities from '@/components/sections/BusinessCities';
import { HOMEPAGE_SELLER_BENEFITS, HOMEPAGE_BUYER_BENEFITS, HOMEPAGE_SUCCESS_STORIES } from '@/data/master-data';

export const metadata: Metadata = {
  title: 'TRADINGO | The Global Smart Trade System',
  description: 'India\'s first Trusted Electronic Marketplace (TEM). Discover verified B2B suppliers, compare wholesale prices, and trade securely across 500+ cities with TRADINGO.',
  openGraph: {
    title: 'TRADINGO | The Global Smart Trade System',
    description: 'India\'s first Trusted Electronic Marketplace (TEM). Discover verified B2B suppliers, compare wholesale prices, and trade securely across 500+ cities.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'TRADINGO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TRADINGO | The Global Smart Trade System',
    description: 'India\'s first Trusted Electronic Marketplace (TEM). Discover verified B2B suppliers across 500+ cities.',
  },
};

const sellerBenefits = HOMEPAGE_SELLER_BENEFITS;
const buyerBenefits = HOMEPAGE_BUYER_BENEFITS;
const successStories = HOMEPAGE_SUCCESS_STORIES.map(s => ({
  quote: s.quote,
  author: s.name,
  role: s.role,
  company: s.company,
  rating: 5,
}));

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TRADINGO',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tradingo.com',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tradingo.com'}/logo/trdn.png`,
  description: "India's first Trusted Electronic Marketplace (TEM). Discover verified B2B suppliers, compare wholesale prices, and trade securely across 500+ cities.",
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tradingo.com/contact',
  },
  sameAs: [],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <TradingAcrossBorders />
      <IndiaHubs />
      <AboutTradingo />
      <Separator />

      {/* 3. Seller Benefits */}
      <section className="relative overflow-hidden py-20 bg-white/[0.02]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-[rgba(255,77,0,0.03)] blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[100px]" />
        </div>
        <div className="relative z-10 container-main">
          <div className="mx-auto max-w-4xl text-center">
            <img src="/logo/trdn.png" alt="TRADINGO" loading="lazy" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />
            <h2 className="mt-6 text-3xl font-black text-white sm:text-4xl lg:text-5xl">Why Sell on TRADINGO?</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/50 sm:text-base">Reach millions of buyers across India with zero upfront investment. Our platform is built for sellers.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sellerBenefits.map((item, i) => {
              const emojis = ['\uD83D\uDCB0', '\uD83D\uDD0D', '\uD83C\uDF1F', '\uD83D\uDEE1\uFE0F', '\uD83C\uDFC6', '\uD83D\uDCC8'];
              const colors = ['#3D8BFF', '#F59E0B', '#D4AF37', '#4ade80', '#F43F5E', '#8B5CF6'];
              const hrefs = ['/trading', '/why-tradingo', '/tradhexa', '/for-sellers', '/tradgo', '/gocash'];
              return (
                <a key={item.title} href={hrefs[i] || '/for-sellers'}
                  className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[rgba(212,175,55,0.2)]"
                  style={{ backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                    style={{ background: `linear-gradient(135deg, ${colors[i % colors.length]}20, ${colors[i % colors.length]}08)`, border: `1px solid ${colors[i % colors.length]}20` }}>
                    {emojis[i % emojis.length]}
                  </div>
                  <h3 className="mt-4 text-lg font-black text-white">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/45">{item.description}</p>
                  <div className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[11px] font-semibold text-white/50 transition-all group-hover:border-[rgba(212,175,55,0.2)] group-hover:text-[#D4AF37]">Explore &rarr;</div>
                </a>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <a href="/for-sellers" className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-6 py-3 text-sm font-bold text-[#D4AF37] transition-all hover:bg-[rgba(212,175,55,0.1)] hover:scale-105">View All Seller Benefits &rarr;</a>
          </div>
        </div>
      </section>

      <Separator />

      {/* 4. Buyer Benefits */}
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-[rgba(255,77,0,0.03)] blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[100px]" />
        </div>
        <div className="relative z-10 container-main">
          <div className="mx-auto max-w-4xl text-center">
            <img src="/logo/trdn.png" alt="TRADINGO" loading="lazy" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />
            <h2 className="mt-6 text-3xl font-black text-white sm:text-4xl lg:text-5xl">Why Buy on TRADINGO?</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/50 sm:text-base">Source verified products from trusted sellers. Get competitive quotes and trade with confidence.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {buyerBenefits.map((item, i) => {
              const emojis = ['\uD83D\uDD0D', '\uD83D\uDCE9', '\uD83D\uDEE1\uFE0F', '\uD83D\uDCB0', '\uD83C\uDF1F', '\uD83D\uDCC8'];
              const colors = ['#3D8BFF', '#F59E0B', '#4ade80', '#D4AF37', '#F43F5E', '#8B5CF6'];
              const hrefs = ['/search', '/rfq', '/why-tradingo', '/for-buyers', '/tradbuy', '/gocash'];
              return (
                <a key={item.title} href={hrefs[i] || '/for-buyers'}
                  className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[rgba(212,175,55,0.2)]"
                  style={{ backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                    style={{ background: `linear-gradient(135deg, ${colors[i % colors.length]}20, ${colors[i % colors.length]}08)`, border: `1px solid ${colors[i % colors.length]}20` }}>
                    {emojis[i % emojis.length]}
                  </div>
                  <h3 className="mt-4 text-lg font-black text-white">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/45">{item.description}</p>
                  <div className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[11px] font-semibold text-white/50 transition-all group-hover:border-[rgba(212,175,55,0.2)] group-hover:text-[#D4AF37]">Explore &rarr;</div>
                </a>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <a href="/for-buyers" className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-6 py-3 text-sm font-bold text-[#D4AF37] transition-all hover:bg-[rgba(212,175,55,0.1)] hover:scale-105">View All Buyer Benefits &rarr;</a>
          </div>
        </div>
      </section>

      <Separator />

      {/* 5. Why TRADINGO */}
      <section className="relative overflow-hidden py-20 bg-white/[0.02]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-[rgba(255,77,0,0.03)] blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[100px]" />
        </div>
        <div className="relative z-10 container-main">
          <div className="mx-auto max-w-4xl text-center">
            <img src="/logo/trdn.png" alt="TRADINGO" loading="lazy" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />
            <h2 className="mt-6 text-3xl font-black text-white sm:text-4xl lg:text-5xl">Why TRADINGO?</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/50 sm:text-base">We&apos;re not just another marketplace. Here&apos;s what makes us different.</p>
          </div>
          <div className="mt-10 mx-auto grid max-w-5xl gap-5 sm:grid-cols-2">
            {[
              { emoji: '\uD83D\uDEE1\uFE0F', title: 'Zero-Risk Trading', desc: 'Escrow-protected payments ensure every transaction is secure. Pay only when satisfied.', color: '#4ade80', href: '/why-tradingo' },
              { emoji: '\uD83E\uDD16', title: 'AI Smart Matching', desc: 'Our AI matches your requirements with the perfect trading partners automatically.', color: '#3D8BFF', href: '/tradhexa' },
              { emoji: '\uD83D\uDCB0', title: 'Earn While You Trade', desc: 'GOCASH rewards program gives you cashback on every successful transaction.', color: '#D4AF37', href: '/gocash' },
              { emoji: '\uD83C\uDF10', title: 'Pan-India Network', desc: 'Connect with traders across 500+ cities. Expand your business nationwide.', color: '#F59E0B', href: '/about-tradingo' },
            ].map((item) => (
              <a key={item.title} href={item.href}
                className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[rgba(212,175,55,0.2)]"
                style={{ backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                  style={{ background: `linear-gradient(135deg, ${item.color}20, ${item.color}08)`, border: `1px solid ${item.color}20` }}>
                  {item.emoji}
                </div>
                <h3 className="mt-4 text-lg font-black text-white">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/45">{item.desc}</p>
                <div className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[11px] font-semibold text-white/50 transition-all group-hover:border-[rgba(212,175,55,0.2)] group-hover:text-[#D4AF37]">Learn More &rarr;</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <TradhexaEngines />

      <Separator />

      {/* 7. GOCASH Rewards */}
      <section className="relative overflow-hidden py-20 bg-white/[0.02]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-[rgba(255,77,0,0.03)] blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[100px]" />
        </div>
        <div className="relative z-10 container-main">
          <div className="mx-auto max-w-4xl text-center">
            <img src="/logo/trdn.png" alt="TRADINGO" loading="lazy" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />
            <h2 className="mt-6 text-3xl font-black text-white sm:text-4xl lg:text-5xl">GOCASH Rewards Program</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/50 sm:text-base">Earn GOCASH on every successful trade. Redeem for listing boosts, premium analytics, platform discounts, and exclusive seller tools.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              { emoji: '\uD83E\uDE99', title: 'Earn GOCASH', desc: 'Get 2-5% back in GOCASH on every completed trade', color: '#D4AF37', href: '/gocash' },
              { emoji: '\uD83D\uDCCA', title: 'Boost Listings', desc: 'Use GOCASH to promote your products to top positions', color: '#3D8BFF', href: '/gocash' },
              { emoji: '\uD83C\uDF1F', title: 'Unlock Perks', desc: 'Redeem for analytics, support, and premium features', color: '#8B5CF6', href: '/gocash' },
            ].map((item) => (
              <a key={item.title} href={item.href}
                className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[rgba(212,175,55,0.2)]"
                style={{ backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                  style={{ background: `linear-gradient(135deg, ${item.color}20, ${item.color}08)`, border: `1px solid ${item.color}20` }}>
                  {item.emoji}
                </div>
                <h3 className="mt-4 text-lg font-black text-white">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/45">{item.desc}</p>
                <div className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[11px] font-semibold text-white/50 transition-all group-hover:border-[rgba(212,175,55,0.2)] group-hover:text-[#D4AF37]">Learn More &rarr;</div>
              </a>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a href="/gocash" className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-6 py-3 text-sm font-bold text-[#D4AF37] transition-all hover:bg-[rgba(212,175,55,0.1)] hover:scale-105">Learn About GOCASH &rarr;</a>
          </div>
        </div>
      </section>

      <Separator />

      {/* 8. TRADGO Race */}
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-[rgba(255,77,0,0.03)] blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <img src="/logo/trdn.png" alt="TRADINGO" loading="lazy" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />
            <h2 className="mt-6 text-3xl font-black text-white sm:text-4xl lg:text-5xl">TRADGO &mdash; Gamified Trading Races</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/50 sm:text-base">Turn trading into a sport. Compete in trading races, earn badges, climb leaderboards, and unlock exclusive rewards.</p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { emoji: '\u26A1', title: 'Speed Trader', desc: 'Complete trades faster than your competitors. Quick execution and rapid response times earn top points in every race period.', color: '#FBBF24' },
              { emoji: '\uD83D\uDCC8', title: 'Volume Master', desc: 'Dominate the leaderboard by trading at scale. Higher trade volumes unlock bigger rewards and exclusive Volume Master badges.', color: '#3D8BFF' },
              { emoji: '\uD83D\uDC51', title: 'Consistency King', desc: 'Show up every day. Consistent trading activity across the month earns streak bonuses and the coveted Consistency King crown.', color: '#D4AF37' },
              { emoji: '\uD83E\uDD1D', title: 'Deal Maker', desc: 'Quality over quantity. Close high-value deals with excellent ratings to earn the Deal Maker title and premium rewards.', color: '#4ade80' },
            ].map((badge) => (
              <a key={badge.title} href="/tradgo"
                className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[rgba(212,175,55,0.2)]"
                style={{ backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                  style={{ background: `linear-gradient(135deg, ${badge.color}20, ${badge.color}08)`, border: `1px solid ${badge.color}20` }}>
                  {badge.emoji}
                </div>
                <h3 className="mt-4 text-lg font-black text-white">{badge.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/45">{badge.desc}</p>
                <div className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[11px] font-semibold text-white/50 transition-all group-hover:border-[rgba(212,175,55,0.2)] group-hover:text-[#D4AF37]">Learn More &rarr;</div>
              </a>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a href="/tradgo" className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-6 py-3 text-sm font-bold text-[#D4AF37] transition-all hover:bg-[rgba(212,175,55,0.1)] hover:scale-105">Join TRADGO Races &rarr;</a>
          </div>
        </div>
      </section>

      <Separator />

      {/* 9. Success Stories */}
      <section className="relative overflow-hidden py-20 bg-white/[0.02]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-[rgba(255,77,0,0.03)] blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[100px]" />
        </div>
        <div className="relative z-10 container-main">
          <div className="mx-auto max-w-4xl text-center">
            <img src="/logo/trdn.png" alt="TRADINGO" loading="lazy" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />
            <h2 className="mt-6 text-3xl font-black text-white sm:text-4xl lg:text-5xl leading-tight">Built by Businesses. Powered by TRADHEXA&trade;. Proven by Results. &#x1F680;</h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-white/50 sm:text-base">Explore inspiring stories of buyers, sellers, manufacturers, distributors, and service providers who used TRADINGO&apos;s 6-Engine Business Framework&trade;, Near to Far&trade; discovery, RFQ system, and Zero Commission trading model to unlock new growth opportunities across India and beyond.</p>
          </div>

          {/* Stats strip */}
          <div className="mt-10 grid gap-4 sm:grid-cols-4">
            {[
              { value: '3x', label: 'Avg. Revenue Growth', color: '#4ade80' },
              { value: '20K+', label: 'Active Businesses', color: '#3D8BFF' },
              { value: '75K+', label: 'RFQs Closed', color: '#D4AF37' },
              { value: '500+', label: 'Cities Reached', color: '#FF4D00' },
            ].map((stat) => (
              <div key={stat.label}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 text-center transition-all duration-500 hover:-translate-y-1 hover:border-[rgba(255,77,0,0.2)]"
                style={{ backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <span className="text-2xl font-black sm:text-3xl" style={{ color: stat.color }}>{stat.value}</span>
                <p className="mt-1 text-xs text-white/50 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Story cards */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {successStories.map((s, i) => {
              const colors = ['#4ade80', '#3D8BFF', '#D4AF37', '#FF4D00'];
              const metrics = [
                { value: '3x', label: 'Revenue Growth' },
                { value: '20+ hrs', label: 'Weekly Saved' },
                { value: '\u20B91.2L', label: 'GOCASH Earned' },
                { value: '6', label: 'Export Countries' },
              ];
              return (
                <div key={s.author}
                  className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[rgba(255,77,0,0.2)]"
                  style={{ backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl"
                      style={{ border: '2px solid rgba(255,77,0,0.2)' }}>
                      <img src={HOMEPAGE_SUCCESS_STORIES[i].image} alt={s.author} loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white truncate">{s.author}</h3>
                        <span className="shrink-0 rounded-full bg-[rgba(255,77,0,0.1)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#FF4D00]">Verified</span>
                      </div>
                      <p className="text-xs text-white/40 truncate">{s.role}, {s.company}</p>
                      <div className="mt-1 flex gap-0.5">
                        {Array.from({ length: s.rating }).map((_, ri) => (
                          <span key={ri} className="text-xs">&#x2B50;</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-white/60 italic">&ldquo;{s.quote}&rdquo;</blockquote>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
                    <span className="text-lg font-black" style={{ color: colors[i % colors.length] }}>{metrics[i].value}</span>
                    <span className="text-[11px] text-white/40">{metrics[i].label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <a href="/about-tradingo" className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,77,0,0.25)] bg-[rgba(255,77,0,0.08)] px-6 py-3 text-sm font-bold text-[#FF4D00] transition-all hover:bg-[rgba(255,77,0,0.14)] hover:scale-105">&#x1F4D6; Explore Success Stories &rarr;</a>
          </div>
        </div>
      </section>

      <Separator />

      <BusinessCities />
    </>
  );
}

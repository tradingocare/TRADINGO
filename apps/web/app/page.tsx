import type { Metadata } from 'next';
import HeroSection from '@/components/sections/HeroSection';
import TradingAcrossBorders from '@/components/sections/TradingAcrossBorders';
import IndiaHubs from '@/components/sections/IndiaHubs';
import TradhexaEngines from '@/components/sections/TradhexaEngines';
import AboutTradingo from '@/components/sections/AboutTradingo';
import { Separator } from '@/components/ui/separator';
import BusinessCities from '@/components/sections/BusinessCities';
import { HOMEPAGE_SELLER_BENEFITS, HOMEPAGE_BUYER_BENEFITS } from '@/data/master-data';

const sellerBenefits = HOMEPAGE_SELLER_BENEFITS;
const buyerBenefits = HOMEPAGE_BUYER_BENEFITS;


export const metadata: Metadata = {
  title: { absolute: 'Goods & Services for Commercial and Retail | B2B e-Marketplace' },
  description:
    'Find manufacturers, traders, distributors, and buyers in one B2B e-Marketplace. Source branded products, daily essentials, workspace and production supplies, and machinery from trusted companies at competitive prices, with fast and reliable delivery. TRADINGO helps businesses operate smarter, grow efficiently, and scale sustainably across commercial, retail, and corporate sectors with trusted trade solutions.',
  openGraph: {
    title: 'Goods & Services for Commercial and Retail | B2B e-Marketplace',
    description:
      'Find manufacturers, traders, distributors, and buyers in one B2B e-Marketplace. Source branded products, daily essentials, workspace and production supplies, and machinery from trusted companies at competitive prices, with fast and reliable delivery. TRADINGO helps businesses operate smarter, grow efficiently, and scale sustainably across commercial, retail, and corporate sectors with trusted trade solutions.',
    images: [
      { url: '/og/tradingo-og-1200x630.png', width: 1200, height: 630, alt: 'TRADINGO — Trading Right. Go Bright.' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Goods & Services for Commercial and Retail | B2B e-Marketplace',
    description:
      'Find manufacturers, traders, distributors, and buyers in one B2B e-Marketplace. Source branded products, daily essentials, workspace and production supplies, and machinery from trusted companies at competitive prices, with fast and reliable delivery. TRADINGO helps businesses operate smarter, grow efficiently, and scale sustainably across commercial, retail, and corporate sectors with trusted trade solutions.',
    images: ['/og/tradingo-og-1200x630.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TRADINGO',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingo.in',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingo.in'}/logo/trdn5.png`,
  description:
    'Find verified manufacturers, traders, distributors, and service providers and connect with B2B and B2C buyers. Source branded products, daily essentials, workspace and production supplies, machinery, and professional services from trusted companies at competitive prices, with fast and reliable delivery and trusted trade solutions. We help you operate smarter, grow efficiently, and scale sustainably across commercial, retail, and corporate sectors.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://tradingo.in/contact',
  },
  sameAs: [
    'https://linkedin.com/company/tradingo',
    'https://facebook.com/tradingo',
    'https://instagram.com/tradingo',
    'https://www.youtube.com/@TradingoIndia',
  ],
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
        <section className="relative overflow-hidden py-14 sm:py-16 lg:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />
            <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-accent/3 blur-[100px]" />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-7xl text-center">
              <img src="/logo/trdn5.png" alt="TRADINGO" loading="lazy" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />
<h2 className="mt-6 text-3xl font-black text-text-primary sm:text-4xl lg:text-5xl">Why Sell on TRADINGO?</h2>
                <p className="mx-auto mt-4 max-w-7xl text-base leading-relaxed text-text-secondary sm:text-lg sm:text-justify">Reach millions of buyers across India with zero upfront investment. Our platform is built for sellers.</p>
            </div>
            <div className="mt-8 grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sellerBenefits.map((item, i) => {
                const emojis = ['\uD83D\uDCB0', '\uD83D\uDD0D', '\uD83C\uDF1F', '\uD83D\uDEE1\uFE0F', '\uD83C\uDFC6', '\uD83D\uDCC8'];
                const accentTokens = ['--accent-blue', '--accent-amber', '--accent-gold', '--accent-green', '--accent-pink', '--accent-purple'];
                const hrefs = ['/trading', '/why-tradingo', '/tradhexa', '/for-sellers', '/tradgo', '/gocash'];
                const c = accentTokens[i % accentTokens.length];
                return (
                  <a key={item.title} href={hrefs[i] || '/for-sellers'}
                    className="group relative overflow-hidden rounded-[22px] border-border bg-surface transition-all duration-300 flex">
                    <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                      style={{ background: `radial-gradient(600px circle at 30% 50%, color-mix(in srgb, var(${c}) 15%, transparent), transparent 50%)` }} />
                    <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                      style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${c}) 27%, transparent), 0 0 28px color-mix(in srgb, var(${c}) 12%, transparent)` }} />
                    <div className="relative w-[5px] flex-shrink-0 overflow-hidden rounded-l-[22px]">
                      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, var(${c}), color-mix(in srgb, var(${c}) 80%, transparent), color-mix(in srgb, var(${c}) 40%, transparent))` }} />
                      <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                        style={{ boxShadow: `0 0 18px var(${c})` }} />
                    </div>
                    <div className="relative z-10 flex flex-1 items-center gap-3 p-4 md:p-5">
                      <span className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-[12px] text-lg md:text-xl"
                        style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(${c}) 12%, transparent), color-mix(in srgb, var(${c}) 3%, transparent))`, border: `1px solid color-mix(in srgb, var(${c}) 15%, transparent)` }}>
                        {emojis[i % emojis.length]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-black text-text-primary">{item.title}</h3>
                        <p className="text-xs md:text-sm leading-relaxed text-text-secondary mt-0.5">{item.description}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs md:text-sm font-semibold flex-shrink-0"
                        style={{ color: `var(${c})` }}>Explore &rarr;</span>
                    </div>
                  </a>
                );
              })}
            </div>
             <div className="mt-6 sm:mt-8 text-center">
                <a href="/for-sellers" className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-6 py-3 text-sm font-bold text-accent transition-all hover:bg-accent/10 hover:scale-105">View All Seller Benefits &rarr;</a>
             </div>
           </div>
         </section>

       <Separator />

        {/* 4. Buyer Benefits */}
        <section className="relative overflow-hidden py-14 sm:py-16 lg:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />
            <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-accent/3 blur-[100px]" />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-7xl text-center">
              <img src="/logo/trdn5.png" alt="TRADINGO" loading="lazy" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />
<h2 className="mt-6 text-3xl font-black text-text-primary sm:text-4xl lg:text-5xl">Why Buy on TRADINGO?</h2>
                <p className="mx-auto mt-4 max-w-7xl text-base leading-relaxed text-text-secondary sm:text-lg sm:text-justify">Source verified products from trusted sellers. Get competitive quotes and trade with confidence.</p>
            </div>
             <div className="mt-8 grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
               {buyerBenefits.map((item, i) => {
                const emojis = ['\uD83D\uDD0D', '\uD83D\uDCE9', '\uD83D\uDEE1\uFE0F', '\uD83D\uDCB0', '\uD83C\uDF1F', '\uD83D\uDCC8'];
                const accentTokens = ['--accent-blue', '--accent-amber', '--accent-green', '--accent-gold', '--accent-pink', '--accent-purple'];
                const hrefs = ['/search', '/rfq', '/why-tradingo', '/for-buyers', '/tradbuy', '/gocash'];
                const c = accentTokens[i % accentTokens.length];
                return (
                  <a key={item.title} href={hrefs[i] || '/for-buyers'}
                    className="group relative overflow-hidden rounded-[22px] border-border bg-surface transition-all duration-300 flex">
                    <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                      style={{ background: `radial-gradient(600px circle at 30% 50%, color-mix(in srgb, var(${c}) 10%, transparent), transparent 50%)` }} />
                    <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                      style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${c}) 21%, transparent), 0 0 20px color-mix(in srgb, var(${c}) 6%, transparent)` }} />
                    <div className="relative w-[5px] flex-shrink-0 overflow-hidden rounded-l-[22px]">
                      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, var(${c}), color-mix(in srgb, var(${c}) 80%, transparent), color-mix(in srgb, var(${c}) 40%, transparent))` }} />
                      <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                        style={{ boxShadow: `0 0 12px var(${c})` }} />
                    </div>
                    <div className="relative z-10 flex flex-1 items-center gap-3 p-4 md:p-5">
                      <span className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-[12px] text-lg md:text-xl"
                        style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(${c}) 12%, transparent), color-mix(in srgb, var(${c}) 3%, transparent))`, border: `1px solid color-mix(in srgb, var(${c}) 15%, transparent)` }}>
                        {emojis[i % emojis.length]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-black text-text-primary">{item.title}</h3>
                        <p className="text-xs md:text-sm leading-relaxed text-text-secondary mt-0.5">{item.description}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs md:text-sm font-semibold flex-shrink-0"
                        style={{ color: `var(${c})` }}>Explore &rarr;</span>
                    </div>
                  </a>
                );
              })}
            </div>
           <div className="mt-6 sm:mt-8 text-center">
             <a href="/for-buyers" className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-6 py-3 text-sm font-bold text-accent transition-all hover:bg-accent/10 hover:scale-105">View All Buyer Benefits &rarr;</a>
           </div>
         </div>
       </section>

      <Separator />

      {/* 5. Why TRADINGO */}
      <section className="relative overflow-hidden py-14 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-accent/3 blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl text-center">
            <img src="/logo/trdn5.png" alt="TRADINGO" loading="lazy" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />
<h2 className="mt-6 text-3xl font-black text-text-primary sm:text-4xl lg:text-5xl">Why TRADINGO?</h2>
               <p className="mx-auto mt-4 max-w-7xl text-base leading-relaxed text-text-secondary sm:text-lg sm:text-justify">We&apos;re not just another marketplace. Here&apos;s what makes us different.</p>
          </div>
           <div className="mt-8 mx-auto grid max-w-[1600px] gap-4 md:gap-5 sm:grid-cols-2">
            {[
              { emoji: '\uD83D\uDEE1\uFE0F', title: 'Zero-Risk Trading', desc: 'Escrow-protected payments ensure every transaction is secure. Pay only when satisfied.', token: '--accent-green', href: '/why-tradingo' },
              { emoji: '\uD83E\uDD16', title: 'AI Smart Matching', desc: 'Our AI matches your requirements with the perfect trading partners automatically.', token: '--accent-blue', href: '/tradhexa' },
              { emoji: '\uD83D\uDCB0', title: 'Earn While You Trade', desc: 'GOCASH rewards program gives you cashback on every successful transaction.', token: '--accent-gold', href: '/gocash' },
              { emoji: '\uD83C\uDF10', title: 'Pan-India Network', desc: 'Connect with traders across 500+ cities. Expand your business nationwide.', token: '--accent-amber', href: '/about-tradingo' },
            ].map((item) => (
              <a key={item.title} href={item.href}
                className="group relative overflow-hidden rounded-[22px] border-border bg-surface transition-all duration-300 flex">
                <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
style={{ background: `radial-gradient(600px circle at 30% 50%, color-mix(in srgb, var(${item.token}) 15%, transparent), transparent 50%)` }} />
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${item.token}) 27%, transparent), 0 0 28px color-mix(in srgb, var(${item.token}) 12%, transparent)` }} />
                <div className="relative w-[5px] flex-shrink-0 overflow-hidden rounded-l-[22px]">
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, var(${item.token}), color-mix(in srgb, var(${item.token}) 80%, transparent), color-mix(in srgb, var(${item.token}) 40%, transparent))` }} />
                  <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ boxShadow: `0 0 18px var(${item.token})` }} />
                </div>
                <div className="relative z-10 flex flex-1 items-center gap-3 p-4 md:p-5">
                  <span className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-[12px] text-lg md:text-xl"
                    style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(${item.token}) 12%, transparent), color-mix(in srgb, var(${item.token}) 3%, transparent))`, border: `1px solid color-mix(in srgb, var(${item.token}) 15%, transparent)` }}>
                    {item.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-black text-text-primary">{item.title}</h3>
                    <p className="text-xs md:text-sm leading-relaxed text-text-secondary mt-0.5">{item.desc}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs md:text-sm font-semibold flex-shrink-0"
                    style={{ color: `var(${item.token})` }}>Learn More &rarr;</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <TradhexaEngines />

      <Separator />

      {/* 7. GOCASH Rewards */}
      <section className="relative overflow-hidden py-14 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-accent/3 blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl text-center">
            <img src="/logo/trdn5.png" alt="TRADINGO" loading="lazy" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />
<h2 className="mt-6 text-3xl font-black text-text-primary sm:text-4xl lg:text-5xl">GOCASH Rewards Program</h2>
               <p className="mx-auto mt-4 max-w-7xl text-base leading-relaxed text-text-secondary sm:text-lg sm:text-justify">Earn GOCASH on every successful trade. Redeem for listing boosts, premium analytics, platform discounts, and exclusive seller tools.</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              { emoji: '\uD83E\uDE99', title: 'Earn GOCASH', desc: 'Get 2-5% back in GOCASH on every completed trade', token: '--accent-gold', href: '/gocash' },
              { emoji: '\uD83D\uDCCA', title: 'Boost Listings', desc: 'Use GOCASH to promote your products to top positions', token: '--accent-blue', href: '/gocash' },
              { emoji: '\uD83C\uDF1F', title: 'Unlock Perks', desc: 'Redeem for analytics, support, and premium features', token: '--accent-purple', href: '/gocash' },
            ].map((item) => (
              <a key={item.title} href={item.href}
                className="group relative overflow-hidden rounded-[22px] border-border bg-surface transition-all duration-300 flex">
                <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
style={{ background: `radial-gradient(600px circle at 30% 50%, color-mix(in srgb, var(${item.token}) 15%, transparent), transparent 50%)` }} />
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${item.token}) 27%, transparent), 0 0 28px color-mix(in srgb, var(${item.token}) 12%, transparent)` }} />
                <div className="relative w-[5px] flex-shrink-0 overflow-hidden rounded-l-[22px]">
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, var(${item.token}), color-mix(in srgb, var(${item.token}) 80%, transparent), color-mix(in srgb, var(${item.token}) 40%, transparent))` }} />
                  <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ boxShadow: `0 0 18px var(${item.token})` }} />
                </div>
                <div className="relative z-10 flex flex-1 items-center gap-3 p-4 md:p-5">
                  <span className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-[12px] text-lg md:text-xl"
                    style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(${item.token}) 12%, transparent), color-mix(in srgb, var(${item.token}) 3%, transparent))`, border: `1px solid color-mix(in srgb, var(${item.token}) 15%, transparent)` }}>
                    {item.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-black text-text-primary">{item.title}</h3>
                    <p className="text-xs md:text-sm leading-relaxed text-text-secondary mt-0.5">{item.desc}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs md:text-sm font-semibold flex-shrink-0"
                    style={{ color: `var(${item.token})` }}>Learn More &rarr;</span>
                </div>
              </a>
            ))}
           </div>
           <div className="mt-6 sm:mt-8 text-center">
             <a href="/gocash" className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-6 py-3 text-sm font-bold text-accent transition-all hover:bg-accent/10 hover:scale-105">Learn About GOCASH &rarr;</a>
          </div>
        </div>
      </section>

      <Separator />

      {/* 8. TRADGO Race */}
      <section className="relative overflow-hidden py-14 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-accent/3 blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <img src="/logo/trdn5.png" alt="TRADINGO" loading="lazy" className="mx-auto h-10 w-auto opacity-50 sm:h-12" />
<h2 className="mt-6 text-3xl font-black text-text-primary sm:text-4xl lg:text-5xl">TRADGO &mdash; Gamified Trading Races</h2>
               <p className="mx-auto mt-4 max-w-7xl text-base leading-relaxed text-text-secondary sm:text-lg sm:text-justify">Turn trading into a sport. Compete in trading races, earn badges, climb leaderboards, and unlock exclusive rewards.</p>
          </div>

          <div className="mt-8 grid gap-4 md:gap-5 sm:grid-cols-2">
            {[
              { emoji: '\u26A1', title: 'Speed Trader', desc: 'Complete trades faster than your competitors. Quick execution and rapid response times earn top points in every race period.', token: '--accent-yellow' },
              { emoji: '\uD83D\uDCC8', title: 'Volume Master', desc: 'Dominate the leaderboard by trading at scale. Higher trade volumes unlock bigger rewards and exclusive Volume Master badges.', token: '--accent-blue' },
              { emoji: '\uD83D\uDC51', title: 'Consistency King', desc: 'Show up every day. Consistent trading activity across the month earns streak bonuses and the coveted Consistency King crown.', token: '--accent-gold' },
              { emoji: '\uD83E\uDD1D', title: 'Deal Maker', desc: 'Quality over quantity. Close high-value deals with excellent ratings to earn the Deal Maker title and premium rewards.', token: '--accent-green' },
            ].map((badge) => (
              <a key={badge.title} href="/tradgo"
                className="group relative overflow-hidden rounded-[22px] border-border bg-surface transition-all duration-300 flex">
                <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
style={{ background: `radial-gradient(600px circle at 30% 50%, color-mix(in srgb, var(${badge.token}) 15%, transparent), transparent 50%)` }} />
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${badge.token}) 27%, transparent), 0 0 28px color-mix(in srgb, var(${badge.token}) 12%, transparent)` }} />
                <div className="relative w-[5px] flex-shrink-0 overflow-hidden rounded-l-[22px]">
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, var(${badge.token}), color-mix(in srgb, var(${badge.token}) 80%, transparent), color-mix(in srgb, var(${badge.token}) 40%, transparent))` }} />
                  <div className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ boxShadow: `0 0 18px var(${badge.token})` }} />
                </div>
                <div className="relative z-10 flex flex-1 items-center gap-3 p-4 md:p-5">
                  <span className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-[12px] text-lg md:text-xl"
                    style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(${badge.token}) 12%, transparent), color-mix(in srgb, var(${badge.token}) 3%, transparent))`, border: `1px solid color-mix(in srgb, var(${badge.token}) 15%, transparent)` }}>
                    {badge.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-black text-text-primary">{badge.title}</h3>
                    <p className="text-xs md:text-sm leading-relaxed text-text-secondary mt-0.5">{badge.desc}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs md:text-sm font-semibold flex-shrink-0"
                    style={{ color: `var(${badge.token})` }}>Learn More &rarr;</span>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <a href="/tradgo" className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-6 py-3 text-sm font-bold text-accent transition-all hover:bg-accent/10 hover:scale-105">Join TRADGO Races &rarr;</a>
          </div>
        </div>
      </section>

      <Separator />

      <BusinessCities />
    </>
  );
}

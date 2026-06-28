/* ═══════════════════════════════════════════════════════════════
   RECOVERY: components/shared/footer.tsx
   Source: Reconstruction from design system prompt + session memory
   Confidence: MEDIUM
   Assumptions:
     - Uses .glass-card and .glow-surface CSS classes from globals.css
     - 6 separate glass cards in responsive grid (5 top row + 1 newsletter full-width)
     - Newsletter includes email form with subscribe button
     - Uses useCursorGlow hook for cursor-following glow effects
     - Based on the 12-step design system prompt specifications
   ═══════════════════════════════════════════════════════════════ */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowUpRight, Sparkles, Send } from 'lucide-react';
import { TradingoLogo } from '@/components/shared/tradingo-logo';
import { useCursorGlow } from '@/hooks/use-cursor-glow';

const marketplaceLinks = [
  { label: 'TeM tradingo-eMarketplace', href: '/trading' },
  { label: 'Browse Products', href: '/products' },
  { label: 'Categories', href: '/categories' },
  { label: 'RFQ Marketplace', href: '/rfq' },
];

const platformLinks = [
  { label: 'TRADHEXA\u2122', href: '/tradhexa' },
  { label: 'GOCASH Rewards', href: '/gocash' },
  { label: 'TRADGO Race', href: '/tradgo' },
  { label: 'TRADBUY', href: '/tradbuy' },
];

const companyLinks = [
  { label: 'About TRADINGO', href: '/about-tradingo' },
  { label: 'Why TRADINGO', href: '/why-tradingo' },
  { label: 'For Sellers', href: '/for-sellers' },
  { label: 'For Buyers', href: '/for-buyers' },
  { label: 'Seller Plans', href: '/seller-plans' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export function Footer() {
  const [email, setEmail] = useState('');

  const brandRef = useCursorGlow<HTMLDivElement>(0);
  const sellersRef = useCursorGlow<HTMLDivElement>(1);
  const buyersRef = useCursorGlow<HTMLDivElement>(2);
  const temRef = useCursorGlow<HTMLDivElement>(3);
  const companyRef = useCursorGlow<HTMLDivElement>(4);
  const newsletterRef = useCursorGlow<HTMLDivElement>(5);

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.04] bg-[#1F0318]">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-1/4 h-[400px] w-[400px] rounded-full bg-[rgba(255,77,0,0.03)] blur-[100px]" />
        <div className="absolute -right-40 bottom-1/4 h-[350px] w-[350px] rounded-full bg-[rgba(255,77,0,0.02)] blur-[90px]" />
      </div>
      <div className="container-main py-10">

        {/* 5-card top row */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">

          {/* ─── Card 1: Brand Intro ─── */}
          <div ref={brandRef} className="glass-card glow-surface p-5 sm:p-6">
            <Link href="/" className="mb-3 flex items-center gap-2">
              <TradingoLogo height={32} showText />
            </Link>
            <p className="text-sm leading-relaxed text-white/45">
              India&apos;s first TeM tradingo-eMarketplace connecting buyers and sellers through trust,
              technology, and transparent trading.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { label: 'Facebook', href: '#' },
                { label: 'X', href: '#' },
                { label: 'LinkedIn', href: '#' },
                { label: 'YouTube', href: '#' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-[10px] font-medium text-white/40 transition-all hover:border-[rgba(255,77,0,0.25)] hover:bg-[rgba(255,77,0,0.06)] hover:text-[#FF4D00]"
                >
                  {s.label[0]}
                </a>
              ))}
            </div>
          </div>

          {/* ─── Card 2: For Sellers ─── */}
          <div ref={sellersRef} className="glass-card glow-surface p-5 sm:p-6">
            <h3 className="font-display mb-3 text-sm font-semibold uppercase tracking-wider text-white/70">
              For Sellers
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Start Selling', href: '/register' },
                { label: 'Seller Dashboard', href: '/seller/dashboard' },
                { label: 'Seller Plans', href: '/seller-plans' },
                { label: 'Seller Resources', href: '/for-sellers' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-[#FF4D00]"
                  >
                    <span className="h-1 w-1 rounded-full bg-white/20 transition-colors group-hover:bg-[#FF4D00]" />
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Card 3: For Buyers ─── */}
          <div ref={buyersRef} className="glass-card glow-surface p-5 sm:p-6">
            <h3 className="font-display mb-3 text-sm font-semibold uppercase tracking-wider text-white/70">
              For Buyers
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Browse Products', href: '/products' },
                { label: 'Post RFQ', href: '/rfq' },
                { label: 'Buyer Dashboard', href: '/buyer/dashboard' },
                { label: 'Buyer Resources', href: '/for-buyers' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-[#FF4D00]"
                  >
                    <span className="h-1 w-1 rounded-full bg-white/20 transition-colors group-hover:bg-[#FF4D00]" />
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Card 4: TEM Market ─── */}
          <div ref={temRef} className="glass-card glow-surface p-5 sm:p-6">
            <h3 className="font-display mb-3 text-sm font-semibold uppercase tracking-wider text-white/70">
              TEM Market
            </h3>
            <ul className="space-y-3">
              {marketplaceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-[#FF4D00]"
                  >
                    <span className="h-1 w-1 rounded-full bg-white/20 transition-colors group-hover:bg-[#FF4D00]" />
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Card 5: Company ─── */}
          <div ref={companyRef} className="glass-card glow-surface p-5 sm:p-6">
            <h3 className="font-display mb-3 text-sm font-semibold uppercase tracking-wider text-white/70">
              Company
            </h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-[#FF4D00]"
                  >
                    <span className="h-1 w-1 rounded-full bg-white/20 transition-colors group-hover:bg-[#FF4D00]" />
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Separator line */}
        <div className="relative my-8 flex items-center justify-center">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#FF4D00] to-transparent opacity-50" />
          <span className="absolute flex h-3 w-3 items-center justify-center rounded-full bg-[#1F0318]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D00]" />
          </span>
        </div>

        {/* ─── Card 6: Newsletter (full width) ─── */}
        <div className="mx-auto max-w-6xl">
          <div ref={newsletterRef} className="glass-card glow-surface p-5 sm:p-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              {/* Sparkle badge + text */}
              <div className="flex-1">
                <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(255,77,0,0.15)] bg-[rgba(255,77,0,0.06)]">
                  <Send className="h-3.5 w-3.5 text-[#FF4D00]" />
                </span>
                <h3 className="font-display mt-2 text-base font-bold tracking-tight text-white">
                  Subscribe to Newsletter
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-white/40">
                  Get the latest product updates, marketplace insights, and exclusive Tradingo news.
                </p>
              </div>

              {/* Form */}
              <div className="w-full sm:w-auto sm:min-w-[360px]">
                <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className={[
                        'w-full rounded-xl border border-white/[0.08] bg-[rgba(0,0,0,0.35)] px-3.5 py-2.5',
                        'text-sm text-white placeholder:text-white/25',
                        'backdrop-blur transition-all duration-300',
                        'focus:border-[rgba(255,77,0,0.35)] focus:bg-[rgba(0,0,0,0.45)] focus:shadow-[0_0_20px_rgba(255,77,0,0.06)] focus:outline-none',
                      ].join(' ')}
                    />
                  </div>
                  <button
                    type="submit"
                    className={[
                      'group relative overflow-hidden rounded-xl bg-gradient-to-b from-[#FF4D00] to-[#E04400] px-5 py-2.5',
                      'text-sm font-semibold text-white shadow-lg',
                      'transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,77,0,0.3)] hover:translate-y-[-1px]',
                    ].join(' ')}
                  >
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.12] to-transparent" />
                    <span className="pointer-events-none absolute -inset-full left-0 top-0 block h-full w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent transition-all duration-700 group-hover:left-full" />
                    <span className="relative z-10 flex items-center gap-2">
                      Subscribe Now
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </button>
                </form>

                {/* Support email */}
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-white/30 sm:justify-start">
                  <Mail className="h-3 w-3 text-[#FF4D00]/60" />
                  <span>For queries:</span>
                  <a href="mailto:tradingocare@gmail.com" className="text-white/40 transition-colors hover:text-[#FF4D00]">
                    tradingocare@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative mt-8 overflow-hidden rounded-[16px] border border-white/[0.04] bg-[rgba(15,15,20,0.2)] backdrop-blur-[12px] px-5 py-3">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-between gap-3 text-sm text-white/35 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} TRADINGO. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="transition-colors hover:text-[#FF4D00]">Privacy</Link>
              <Link href="/terms" className="transition-colors hover:text-[#FF4D00]">Terms</Link>
              <Link href="/contact" className="transition-colors hover:text-[#FF4D00]">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

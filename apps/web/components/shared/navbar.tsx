/* ═══════════════════════════════════════════════════════════════
   RECOVERY: components/shared/navbar.tsx
   Source: Partial reconstruction from working tree + design system
   Confidence: MEDIUM
   Assumptions:
     - Working tree had an intermediate glass-pill version with OLD
        brand colors (now design system tokens)
     - These were replaced with the new design system colors:
       #1F0318 (bg), #FF4D00 (accent), rgba(255,255,255,0.04) (glass)
     - The glass-nav class from globals.css handles positioning/backdrop
     - framer-motion is available (added to package.json)
   ═══════════════════════════════════════════════════════════════ */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Mail, Phone } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { TradingoLogoIcon } from './tradingo-logo';
import { cn } from '@/lib/utils';

/* ───────── Social SVG icons (minimal, premium) ───────── */

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l6.5 8.5L4 20h2.5l5-5.5L16 20h4l-7-9.5L20 4h-2.5l-4.5 5L8 4H4z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="4" />
      <path d="M8 11v5" />
      <path d="M8 8v0" />
      <circle cx="8" cy="8" r="0.5" fill="currentColor" stroke="none" />
      <path d="M12 16v-5" />
      <path d="M16 16v-3a2 2 0 0 0-4 0" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2.5l-19 7.5 5 2 3 6 3-4 6 3z" />
      <path d="M10.5 13.5l4-4" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="4" />
      <polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none" />
    </svg>
  );
}

const socialLinks = [
  { href: 'https://facebook.com/tradingo', label: 'Facebook', icon: FacebookIcon },
  { href: 'https://x.com/tradingo', label: 'X (Twitter)', icon: TwitterIcon },
  { href: 'https://linkedin.com/company/tradingo', label: 'LinkedIn', icon: LinkedInIcon },
  { href: 'https://t.me/tradingo', label: 'Telegram', icon: TelegramIcon },
  { href: 'https://youtube.com/@tradingo', label: 'YouTube', icon: YoutubeIcon },
];

/* ───────── Top Bar ───────── */

function TopBar() {
  return (
    <div className="hidden h-9 items-center justify-center bg-[#FF4D00] border-b border-[#0000FF]/20 md:flex">
      <div className="flex w-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <a
            href="mailto:tradingocare@gmail.com"
            className="group flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-[#0000FF] transition-colors duration-200 hover:text-white"
          >
            <Mail className="h-3 w-3 text-[#0000FF]/70 group-hover:text-white transition-colors duration-200" />
            <span>GoConect</span>
            <span className="text-[#0000FF]/50 mx-1">/</span>
            <span className="text-[#0000FF]/70 group-hover:text-white transition-colors duration-200">
              tradingocare@gmail.com
            </span>
          </a>
          <span className="h-3 w-px bg-[#0000FF]/20" />
          <a
            href="tel:+919999988888"
            className="group flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-[#0000FF] transition-colors duration-200 hover:text-white"
          >
            <Phone className="h-3 w-3 text-[#0000FF]/70 group-hover:text-white transition-colors duration-200" />
            <span>Goquary</span>
            <span className="text-[#0000FF]/50 mx-1">/</span>
            <span className="text-[#0000FF]/70 group-hover:text-white transition-colors duration-200">
              +91 99999-88888
            </span>
          </a>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#0000FF]/60 mr-2">
            GoSocial
          </span>
          <span className="h-3 w-px bg-[#0000FF]/20 mr-2" />
          {socialLinks.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#0000FF]/70 transition-all duration-200 hover:bg-white/[0.15] hover:text-white hover:scale-110"
            >
              <Icon className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── Navbar ───────── */

interface NavItem {
  label: string;
  subtitle: string;
  href: string;
  cta?: boolean;
  emoji?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Trading', subtitle: 'Marketplace', href: '/products', emoji: '\u{1F6D2}' },
  { label: 'GoLive', subtitle: 'Customers Login', href: '/login', emoji: '\u{1F513}' },
  { label: 'GoStart', subtitle: 'Vendors Login', href: '/seller/login', emoji: '\u{1F3EA}' },
  { label: 'GoJoin', subtitle: 'Create Account', href: '/register', emoji: '\u2728' },
];

const ITEM_BASE =
  'group relative flex flex-col items-center justify-center rounded-full ' +
  'px-4 py-[10px] transition-all duration-300 ' +
  'cursor-pointer';

const LABEL_CLASS =
  'text-sm font-semibold tracking-tight transition-colors duration-300';

const SUBTITLE_CLASS =
  'text-[10px] font-medium uppercase tracking-[0.14em] transition-colors duration-300';

function Indicator({ active, cta }: { active: boolean; cta?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'block h-1.5 w-1.5 rounded-full transition-all duration-300',
        active
          ? cta ? 'bg-[#1F0318]/40' : 'bg-[#FF4D00] animate-nav-active-pulse'
          : cta
            ? 'bg-[#1F0318]/15 group-hover:bg-[#1F0318]/30'
            : 'bg-white/35 group-hover:bg-[#FF4D00]/70'
      )}
    />
  );
}

function NavbarInner() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <nav className="glass-nav">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4">
          <Link
            href="/"
            aria-label="TRADINGO — home"
            className="group relative z-10 flex shrink-0 items-center"
          >
            <span className={cn(ITEM_BASE, 'pr-0.5')}>
              <span className="flex items-center gap-[120px]">
                <TradingoLogoIcon height={48} priority />
                <span className="relative flex flex-col items-center leading-tight">
                  <Indicator active />
                  <span className={cn(LABEL_CLASS, 'font-display text-[#FF4D00]')}>
                    <span className="text-lg leading-none align-middle mr-0.5" aria-hidden>{'\u{1F48E}'}</span>TRADINGO
                  </span>
                  <span className={cn(SUBTITLE_CLASS, 'text-white/55 group-hover:text-[#FF4D00]/80')}>
                    Trading Home
                  </span>
                </span>
              </span>
            </span>
          </Link>

          <ul className="relative z-10 hidden flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);

              if (item.cta) {
                return (
                  <li key={item.href} className="flex items-center">
                    <Link
                      href={item.href}
                      className="btn-accent text-sm px-5 py-2"
                    >
                      <Indicator active={active} cta={item.cta} />
                      <span className="flex flex-col items-center leading-tight">
                        <span className={cn(LABEL_CLASS, 'text-[#1F0318]')}>
                          {item.emoji} {item.label}
                        </span>
                        <span className={cn(SUBTITLE_CLASS, 'text-[#1F0318]/60')}>
                          {item.subtitle}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.href} className="flex items-center">
                  <Link
                    href={item.href}
                    className={cn(
                      ITEM_BASE,
                      'hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(255,77,0,0.12)] hover:scale-105',
                      active && 'bg-white/[0.05]'
                    )}
                  >
                    <Indicator active={active} />
                    <span className="flex flex-col items-center leading-tight">
                      <span
                        className={cn(
                          LABEL_CLASS,
                          active ? 'text-[#FF4D00]' : 'text-white group-hover:text-[#FF4D00]'
                        )}
                      >
                        {item.emoji} {item.label}
                      </span>
                      <span
                        className={cn(
                          SUBTITLE_CLASS,
                          active ? 'text-[#FF4D00]/80' : 'text-white/55 group-hover:text-[#FF4D00]/80'
                        )}
                      >
                        {item.subtitle}
                      </span>
                    </span>

                    {active && (
                      <motion.span
                        layoutId="nav-active-underline"
                        className="animate-nav-underline absolute -bottom-0.5 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="relative z-10 flex items-center gap-1">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-300',
                'hover:scale-105 hover:bg-white/[0.06] md:hidden'
              )}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-pill"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed left-3 right-3 top-20 z-40 mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0000FF]/95 backdrop-blur-[30px] p-2 shadow-[0_15px_50px_rgba(0,0,0,0.55)] md:hidden"
          >
            <div className="flex flex-col gap-1 px-1 py-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);

                if (item.cta) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="btn-accent w-full justify-center py-3"
                    >
                      <Indicator active={active} cta />
                      <span className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-[#1F0318]">
                          {item.emoji} {item.label}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-[#1F0318]/60">
                          {item.subtitle}
                        </span>
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 rounded-full px-4 py-3 transition-all duration-300',
                      'hover:bg-white/[0.04]',
                      active && 'bg-white/[0.05]'
                    )}
                  >
                    <Indicator active={active} />
                    <span className="flex flex-col leading-tight">
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          active ? 'text-[#FF4D00]' : 'text-white'
                        )}
                      >
                        {item.emoji} {item.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-white/50">
                        {item.subtitle}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-white/[0.06] px-2 pb-1 pt-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">Menu</span>
              <ThemeToggle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ───────── Combined Header ───────── */

export function Navbar() {
  return (
    <header className="w-full">
      <TopBar />
      <NavbarInner />
    </header>
  );
}

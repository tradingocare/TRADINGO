'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Mail, Menu, Phone, X } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { TradingoLogoIcon } from './tradingo-logo';
import { cn } from '@/lib/utils';
import { FacebookIcon, LinkedInIcon, InstagramIcon, YoutubeIcon } from './social-icons';

interface NavItem {
  label: string;
  subtitle: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Trading', subtitle: 'PRODUCTS', href: '/products' },
  { label: 'TradeServ', subtitle: 'SERVICES', href: '/tradeserv' },
  { label: 'Tradors', subtitle: 'BUSINESS DIRECTORY', href: '/companies' },
  { label: 'TradeTalk', subtitle: 'BUSINESS NETWORK', href: '/tradetalk' },
  { label: 'GoStart', subtitle: 'CREATE ACCOUNT', href: '/register/vendor' },
  { label: 'GoLive', subtitle: 'VENDORS SIGNUP', href: '/login' },
  { label: 'GoJoin', subtitle: 'LOGIN', href: '/register' },
];

const segmentBase =
  'group relative isolate flex min-h-[46px] flex-col items-center justify-center rounded-full px-3.5 py-2 text-center outline-none transition-[border-color,background-color,box-shadow,color] duration-300 focus-visible:ring-2 focus-visible:ring-[#FF8A00] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base lg:px-4';

const labelClass =
  'relative z-10 text-[13px] font-semibold leading-none tracking-normal transition-colors duration-300';

const subtitleClass =
  'relative z-10 mt-1 text-[9px] font-medium uppercase leading-none tracking-[0.12em] transition-colors duration-300';

const themeToggleClass =
  'h-11 w-11 rounded-full border border-border bg-surface text-text-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-accent-500/15 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]';

const capsuleStyle = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.05), transparent 44%), radial-gradient(circle at 16% 0%, rgba(255,77,0,0.10), transparent 34%), radial-gradient(circle at 84% 100%, rgba(245,158,11,0.08), transparent 30%), rgba(8, 10, 18, 0.94)',
  boxShadow:
    '0 24px 80px rgba(0,0,0,0.55), 0 8px 28px rgba(0,0,0,0.40), 0 0 80px -16px rgba(255,77,0,0.15), 0 0 60px -20px rgba(245,158,11,0.12), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(255,255,255,0.04)',
  backdropFilter: 'blur(32px) saturate(1.15)',
  WebkitBackdropFilter: 'blur(32px) saturate(1.15)',
} satisfies CSSProperties;

function SegmentSeparator() {
  return <span aria-hidden className="hidden h-8 w-px bg-gradient-to-b from-transparent via-white/[0.12] to-transparent md:block" />;
}

function ActiveTreatment() {
  return (
    <span
      aria-hidden
      className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,77,0,0.14),rgba(255,77,0,0.04))] shadow-[0_0_26px_rgba(255,77,0,0.18)]"
    />
  );
}

function TopBar() {
  return (
    <div className="hidden h-9 items-center justify-center border-b border-border md:flex" style={{ background: 'var(--bg-elevated)' }}>
      <div className="flex w-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <a
            href="mailto:tradingocare@gmail.com"
            className="group flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-text-secondary transition-colors duration-200 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <Mail className="h-3 w-3 text-accent-500 transition-colors duration-200 group-hover:text-[#FF7A33]" />
            <span>GoConect</span>
            <span className="mx-1 text-text-tertiary">/</span>
            <span className="text-text-secondary transition-colors duration-200 group-hover:text-accent-500">
              tradingocare@gmail.com
            </span>
          </a>
          <span className="h-3 w-px bg-border" />
          <a
            href="tel:+919999988888"
            className="group flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-text-secondary transition-colors duration-200 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <Phone className="h-3 w-3 text-accent-500 transition-colors duration-200 group-hover:text-[#FF7A33]" />
            <span>Goquary</span>
            <span className="mx-1 text-text-tertiary">/</span>
            <span className="text-text-secondary transition-colors duration-200 group-hover:text-accent-500">
              +91 99999-88888
            </span>
          </a>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
            GoSocial
          </span>
          <span className="mr-2 h-3 w-px bg-border" />
          <a href="https://linkedin.com/company/tradingo" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-text-tertiary transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-500/25 hover:bg-accent-500/15 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"><LinkedInIcon className="h-3.5 w-3.5" /></a>
          <a href="https://facebook.com/tradingo" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-text-tertiary transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-500/25 hover:bg-accent-500/15 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"><FacebookIcon className="h-3.5 w-3.5" /></a>
          <a href="https://instagram.com/tradingo" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-text-tertiary transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-500/25 hover:bg-accent-500/15 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"><InstagramIcon className="h-3.5 w-3.5" /></a>
          <a href="https://www.youtube.com/@TradingoIndia" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-text-tertiary transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-500/25 hover:bg-accent-500/15 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"><YoutubeIcon className="h-3.5 w-3.5" /></a>
        </div>
      </div>
    </div>
  );
}

function HomeSegment({ active, onClick }: { active: boolean; onClick?: () => void }) {
  const logoCapsule = cn(
    segmentBase,
    'nav-capsule-rainbow min-h-[46px] min-w-[50px] border border-border bg-surface px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
  );

  const textCapsule = cn(
    segmentBase,
    'nav-capsule-rainbow hidden min-h-[46px] border border-border bg-surface px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:flex',
    active && 'bg-accent-500/10 shadow-[0_0_30px_rgba(255,77,0,0.16)]'
  );

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/"
        onClick={onClick}
        aria-label="TRADINGO Home"
        className={logoCapsule}
      >
        <span className="relative z-10 flex h-8 items-center">
          <TradingoLogoIcon height={38} priority className="drop-shadow-[0_0_12px_rgba(255,77,0,0.20)]" />
        </span>
      </Link>
      <Link
        href="/"
        onClick={onClick}
        aria-label="TRADINGO Trading Home"
        className={textCapsule}
      >
        {active && <ActiveTreatment />}
        <span className="relative z-10 flex flex-col leading-none">
          <span className="bg-gradient-to-r from-accent-500 via-[#FF7A33] to-[#f59e0b] bg-clip-text text-[15px] font-bold leading-none tracking-normal text-transparent">
            TRADINGO
          </span>
          <span className="mt-1 text-[9px] font-medium uppercase leading-none tracking-[0.14em] text-text-tertiary">
            TRADING HOME
          </span>
        </span>
      </Link>
    </div>
  );
}

function MobileHomeItem({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label="TRADINGO Trading Home"
      className={cn(
        segmentBase,
        'nav-capsule-rainbow min-h-[54px] flex-row items-center justify-start gap-3 border border-border bg-surface-secondary/50 px-5 text-left',
        active && 'bg-accent-500/10 shadow-[0_0_26px_rgba(255,77,0,0.14)]'
      )}
    >
      {active && <ActiveTreatment />}
      <TradingoLogoIcon height={28} priority className="relative z-10 drop-shadow-[0_0_10px_rgba(255,77,0,0.20)]" />
      <span className="relative z-10 flex flex-col leading-none">
        <span className="bg-gradient-to-r from-accent-500 via-[#FF7A33] to-[#f59e0b] bg-clip-text text-[13px] font-bold leading-none tracking-normal text-transparent">
          TRADINGO
        </span>
        <span className="mt-1 text-[9px] font-medium uppercase leading-none tracking-[0.14em] text-text-tertiary">
          TRADING HOME
        </span>
      </span>
    </Link>
  );
}

function DesktopNavItem({ item, active }: { item: NavItem; active: boolean }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex items-center"
      whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.015 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
    >
      <Link
        href={item.href}
        aria-label={`${item.label} ${item.subtitle}`}
        aria-current={active ? 'page' : undefined}
        className={cn(
          segmentBase,
          'nav-capsule-rainbow min-w-[100px] border border-border bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
          active && 'bg-accent-500/10 shadow-[0_0_30px_rgba(255,77,0,0.16)]'
        )}
      >
        {active && <ActiveTreatment />}
        <span className={cn(labelClass, active ? 'text-accent-500' : 'text-text-secondary group-hover:text-text-primary')}>
          {item.label}
        </span>
        <span className={cn(subtitleClass, active ? 'text-[#FF7A33]' : 'text-text-tertiary group-hover:text-[#FF7A33]')}>
          {item.subtitle}
        </span>
      </Link>
    </motion.div>
  );
}

function MobileNavItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-label={`${item.label} ${item.subtitle}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        segmentBase,
        'nav-capsule-rainbow min-h-[54px] items-start border border-border bg-surface-secondary/50 px-5 text-left',
        active && 'bg-accent-500/10 shadow-[0_0_26px_rgba(255,77,0,0.14)]'
      )}
    >
      {active && <ActiveTreatment />}
      <span className={cn(labelClass, active ? 'text-accent-500' : 'text-text-secondary')}>
        {item.label}
      </span>
      <span className={cn(subtitleClass, active ? 'text-[#FF7A33]' : 'text-text-tertiary')}>
        {item.subtitle}
      </span>
    </Link>
  );
}

function NavbarInner() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!mobileOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="glass-nav" aria-label="Global navigation">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div
            className="premium-nav-capsule pointer-events-auto relative isolate flex min-h-14 items-center justify-between gap-2 overflow-hidden rounded-full border border-border px-2 py-2 md:min-h-16"
            style={capsuleStyle}
          >
            <div className="relative z-10 flex items-center gap-2">
              <motion.div
                whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              >
                <HomeSegment active={isActive('/')} />
              </motion.div>
            </div>

            <ul className="relative z-10 hidden flex-1 items-center justify-center gap-2 md:flex">
              {NAV_ITEMS.map((item, index) => (
                <li key={item.label} className="flex items-center gap-2">
                  {index > 0 && <SegmentSeparator />}
                  <DesktopNavItem item={item} active={isActive(item.href)} />
                </li>
              ))}
            </ul>

            <div className="relative z-10 flex items-center gap-1.5">
              <div className="hidden sm:block" aria-label="Dark Mode">
                <ThemeToggle className={themeToggleClass} />
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-global-navigation"
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text-primary transition-all duration-300',
                  'hover:-translate-y-0.5 hover:border-accent-500/35 hover:bg-accent-500/15 hover:text-[#FF7A33]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b12] md:hidden'
                )}
              >
                {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            />
            <motion.div
              id="mobile-global-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="TRADINGO mobile navigation"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 34, scale: 0.98 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.26, ease: 'easeOut' }}
              className="fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-[2rem] border border-border bg-bg-elevated/95 p-3 shadow-[0_28px_90px_rgba(0,0,0,0.62)] backdrop-blur-[30px] md:hidden"
            >
              <div aria-hidden className="mx-auto mb-3 h-1 w-12 rounded-full bg-surface" />
              <div className="grid gap-2">
                <MobileHomeItem active={isActive('/')} onClick={() => setMobileOpen(false)} />
                {NAV_ITEMS.map((item) => (
                  <MobileNavItem
                    key={item.label}
                    item={item}
                    active={isActive(item.href)}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-full border border-border bg-surface-secondary/50 px-4 py-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-tertiary">
                  Dark Mode
                </span>
                <ThemeToggle className="h-11 w-11" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function Navbar() {
  return (
    <header className="w-full">
      <TopBar />
      <NavbarInner />
    </header>
  );
}

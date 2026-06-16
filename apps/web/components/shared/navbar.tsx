'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { MegaMenu } from './mega-menu';
import { TradingoLogo } from './tradingo-logo';
import { cn } from '@/lib/utils';

const tradingColumns = [
  {
    title: 'Marketplace',
    items: [
      { label: 'Browse Products', href: '/products', description: 'Explore thousands of products' },
      { label: 'Browse Categories', href: '/categories', description: 'Find by category' },
      { label: 'RFQ Marketplace', href: '/rfq', description: 'Request for quotes' },
    ],
  },
  {
    title: 'For Participants',
    items: [
      { label: 'For Sellers', href: '/for-sellers', description: 'List and sell products' },
      { label: 'For Buyers', href: '/for-buyers', description: 'Source and purchase' },
    ],
  },
  {
    title: 'Why TRADINGO',
    items: [
      { label: 'Secure Trading', href: '/why-tradingo', description: 'Trust & safety' },
      { label: 'Trading Plans', href: '/seller-plans', description: 'Choose your plan' },
    ],
  },
];

const featuresColumns = [
  {
    title: 'Platform Features',
    items: [
      { label: 'TRADHEXA™', href: '/tradhexa', description: '6 powerful trading engines' },
      { label: 'GOCASH Rewards', href: '/gocash', description: 'Earn rewards on every trade' },
      { label: 'TRADGO Race', href: '/tradgo', description: 'Gamified trading challenges' },
      { label: 'TRADBUY', href: '/tradbuy', description: 'Instant purchase program' },
    ],
  },
];

const companyColumns = [
  {
    title: 'Company',
    items: [
      { label: 'About TRADINGO', href: '/about-tradingo', description: 'Our mission & team' },
      { label: 'Why TRADINGO', href: '/why-tradingo', description: 'What makes us different' },
      { label: 'Contact Us', href: '/contact', description: 'Get in touch' },
    ],
  },
  {
    title: 'Policies',
    items: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 dark:bg-dark-surface/95 dark:border-dark-border">
      <nav className="container-main flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <TradingoLogo height={40} showText />
          </Link>

          <div className="hidden lg:flex lg:items-center lg:gap-1">
            <Link
              href="/trading"
              className="px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary dark:text-dark-text-secondary dark:hover:text-dark-text-primary"
            >
              TEM™
            </Link>
            <MegaMenu label="Trading" columns={tradingColumns} />
            <MegaMenu
              label="Platform"
              columns={featuresColumns}
              featured={{
                title: 'TRADHEXA™ Engines',
                description: 'Discover 6 integrated trading engines powering the TEM ecosystem.',
                href: '/tradhexa',
              }}
            />
            <MegaMenu label="Company" columns={companyColumns} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border px-4 pb-6 pt-2 lg:hidden dark:border-dark-border">
          <div className="space-y-1">
            <MobileNavLink href="/trading" label="TEM™ Marketplace" />
            <MobileSection
              title="Trading"
              isOpen={expandedSection === 'trading'}
              onToggle={() => toggleSection('trading')}
            >
              <MobileNavLink href="/products" label="Browse Products" />
              <MobileNavLink href="/categories" label="Browse Categories" />
              <MobileNavLink href="/rfq" label="RFQ Marketplace" />
              <MobileNavLink href="/for-sellers" label="For Sellers" />
              <MobileNavLink href="/for-buyers" label="For Buyers" />
            </MobileSection>
            <MobileSection
              title="Platform"
              isOpen={expandedSection === 'platform'}
              onToggle={() => toggleSection('platform')}
            >
              <MobileNavLink href="/tradhexa" label="TRADHEXA™" />
              <MobileNavLink href="/gocash" label="GOCASH Rewards" />
              <MobileNavLink href="/tradgo" label="TRADGO Race" />
              <MobileNavLink href="/tradbuy" label="TRADBUY" />
              <MobileNavLink href="/seller-plans" label="Seller Plans" />
            </MobileSection>
            <MobileSection
              title="Company"
              isOpen={expandedSection === 'company'}
              onToggle={() => toggleSection('company')}
            >
              <MobileNavLink href="/about-tradingo" label="About" />
              <MobileNavLink href="/why-tradingo" label="Why TRADINGO" />
              <MobileNavLink href="/contact" label="Contact" />
              <MobileNavLink href="/privacy" label="Privacy" />
              <MobileNavLink href="/terms" label="Terms" />
            </MobileSection>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">Log In</Button>
            </Link>
            <Link href="/register" className="w-full">
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary"
    >
      {label}
    </Link>
  );
}

function MobileSection({
  title,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary"
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && <div className="ml-4 mt-1 space-y-1 pb-2">{children}</div>}
    </div>
  );
}

import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { TradingoLogo } from '@/components/shared/tradingo-logo';

const footerLinks = [
  {
    title: 'Marketplace',
    links: [
      { label: 'TEM™ Trading', href: '/trading' },
      { label: 'Browse Products', href: '/products' },
      { label: 'Categories', href: '/categories' },
      { label: 'RFQ Marketplace', href: '/rfq' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'TRADHEXA™', href: '/tradhexa' },
      { label: 'GOCASH Rewards', href: '/gocash' },
      { label: 'TRADGO Race', href: '/tradgo' },
      { label: 'TRADBUY', href: '/tradbuy' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About TRADINGO', href: '/about-tradingo' },
      { label: 'Why TRADINGO', href: '/why-tradingo' },
      { label: 'For Sellers', href: '/for-sellers' },
      { label: 'For Buyers', href: '/for-buyers' },
      { label: 'Seller Plans', href: '/seller-plans' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-secondary dark:bg-dark-surface-secondary dark:border-dark-border">
      <div className="container-main py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <TradingoLogo height={36} showText />
            </Link>
            <p className="mb-6 max-w-xs text-sm text-text-secondary dark:text-dark-text-secondary">
              India&apos;s first TEM™ E-Marketplace connecting buyers and sellers through trust,
              technology, and transparent trading.
            </p>
            <div className="space-y-3 text-sm text-text-secondary dark:text-dark-text-secondary">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary-600" />
                <a href="mailto:support@tradingo.com" className="hover:text-primary-600">support@tradingo.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary-600" />
                <span>+91 1800-TRADINGO</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-primary-600" />
                <span>Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary dark:text-dark-text-primary">
                {group.title}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-primary-600 dark:text-dark-text-secondary dark:hover:text-primary-400"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-text-tertiary dark:text-dark-text-tertiary sm:flex-row">
          <p>&copy; {new Date().getFullYear()} TRADINGO. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary-600">Privacy</Link>
            <Link href="/terms" className="hover:text-primary-600">Terms</Link>
            <Link href="/contact" className="hover:text-primary-600">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

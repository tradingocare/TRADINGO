import { PageHeader } from '@/components/shared/page-header'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

const sitemapSections = [
  {
    title: 'Marketplace',
    links: [
      { label: 'Browse Products', href: '/products' },
      { label: 'Categories', href: '/categories' },
      { label: 'Trading', href: '/trading' },
      { label: 'RFQ Marketplace', href: '/rfq' },
      { label: 'Compare Products', href: '/compare' },
      { label: 'Search', href: '/search' },
    ],
  },
  {
    title: 'For Sellers',
    links: [
      { label: 'Seller Dashboard', href: '/seller/dashboard' },
      { label: 'My Products', href: '/seller/products' },
      { label: 'Orders', href: '/seller/orders' },
      { label: 'Payments', href: '/seller/payments' },
      { label: 'Analytics', href: '/seller/analytics' },
      { label: 'Seller Plans', href: '/seller-plans' },
    ],
  },
  {
    title: 'For Buyers',
    links: [
      { label: 'Buyer Dashboard', href: '/buyer/dashboard' },
      { label: 'My Orders', href: '/buyer/orders' },
      { label: 'My Quotes', href: '/buyer/quotes' },
      { label: 'My RFQs', href: '/buyer/rfqs' },
      { label: 'Saved Products', href: '/buyer/saved-products' },
      { label: 'Suppliers', href: '/buyer/suppliers' },
    ],
  },
  {
    title: 'TradeServ',
    links: [
      { label: 'TradeServ Home', href: '/tradeserv' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About TRADINGO', href: '/about-tradingo' },
      { label: 'Features', href: '/features' },
      { label: 'Industries', href: '/industries' },
      { label: 'For Buyers', href: '/for-buyers' },
      { label: 'For Sellers', href: '/for-sellers' },
      { label: 'Press Kit', href: '/press-kit' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Seller Support', href: '/seller/support' },
      { label: 'Buyer Support', href: '/buyer/support' },
      { label: 'Enterprise Plans', href: '/enterprise' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Refund Policy', href: '/refund' },
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-4xl mx-auto px-4">
        <PageHeader
          title="Sitemap"
          description="A complete overview of all pages and sections on TRADINGO."
        />
        <div className="mt-8 rounded-3xl p-6 sm:p-8 bg-surface" style={{ backdropFilter: 'blur(24px)', border: '1px solid var(--border-color)' }}>
          <div className="grid gap-10 sm:grid-cols-2">
            {sitemapSections.map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-bold text-text-primary">{section.title}</h2>
                <ul className="mt-3 space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent-500"
                      >
                        <ChevronRight className="h-3.5 w-3.5 text-text-tertiary transition-colors group-hover:text-accent-500" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-3xl p-6 text-center bg-surface" style={{ backdropFilter: 'blur(24px)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm text-text-tertiary">
            Can&apos;t find what you&apos;re looking for?{' '}
            <Link href="/contact" className="text-accent-500 hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

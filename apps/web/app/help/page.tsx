'use client';

import { useState } from 'react';
import { Search, HelpCircle, ShoppingCart, Users, CreditCard, Truck, RotateCcw, Shield, Headphones, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { CTABlock } from '@/components/shared/cta-block';

interface Category {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface Article {
  title: string;
  description: string;
  category: string;
  href: string;
}

const categories: Category[] = [
  { id: 'getting-started', title: 'Getting Started', icon: <HelpCircle className="h-6 w-6" />, description: 'Learn the basics of using TRADINGO' },
  { id: 'account-billing', title: 'Account & Billing', icon: <CreditCard className="h-6 w-6" />, description: 'Manage your account and payments' },
  { id: 'selling', title: 'Selling', icon: <ShoppingCart className="h-6 w-6" />, description: 'Tools and tips for sellers' },
  { id: 'buying', title: 'Buying', icon: <Users className="h-6 w-6" />, description: 'Guide to purchasing on TRADINGO' },
  { id: 'orders-shipping', title: 'Orders & Shipping', icon: <Truck className="h-6 w-6" />, description: 'Track and manage your orders' },
  { id: 'returns-refunds', title: 'Returns & Refunds', icon: <RotateCcw className="h-6 w-6" />, description: 'Return policies and refund process' },
  { id: 'security', title: 'Security', icon: <Shield className="h-6 w-6" />, description: 'Stay safe on our platform' },
  { id: 'technical-support', title: 'Technical Support', icon: <Headphones className="h-6 w-6" />, description: 'Resolve technical issues' },
];

const articles: Article[] = [
  { title: 'How to create an account', description: 'Step-by-step guide to registering as a buyer or seller on TRADINGO.', category: 'getting-started', href: '/help/faq' },
  { title: 'Completing your profile verification', description: 'Learn what documents are needed and how to get verified.', category: 'getting-started', href: '/help/faq' },
  { title: 'Understanding the dashboard', description: 'Overview of the main navigation and key sections.', category: 'getting-started', href: '/help/faq' },
  { title: 'How to update your profile', description: 'Change your personal information, business details, and preferences.', category: 'account-billing', href: '/help/faq' },
  { title: 'Managing payment methods', description: 'Add, remove, or update your payment methods.', category: 'account-billing', href: '/help/faq' },
  { title: 'Understanding your invoices', description: 'How to view and download your transaction invoices.', category: 'account-billing', href: '/help/faq' },
  { title: 'How to create a product listing', description: 'Step-by-step guide to listing your products on TRADINGO.', category: 'selling', href: '/help/faq' },
  { title: 'Seller commission and fee structure', description: 'Understand our fee structure and commission rates.', category: 'selling', href: '/help/faq' },
  { title: 'Managing orders as a seller', description: 'How to process, ship, and manage customer orders.', category: 'selling', href: '/help/faq' },
  { title: 'How to place an order', description: 'Browse products, add to cart, and complete your purchase.', category: 'buying', href: '/help/faq' },
  { title: 'Understanding RFQs', description: 'Learn how to create and manage Request for Quotes.', category: 'buying', href: '/help/faq' },
  { title: 'Comparing supplier quotes', description: 'How to evaluate and compare quotes from multiple suppliers.', category: 'buying', href: '/help/faq' },
  { title: 'How to track your order', description: 'Track your shipments and get delivery updates.', category: 'orders-shipping', href: '/help/faq' },
  { title: 'Shipping timelines and costs', description: 'Understanding delivery estimates and shipping charges.', category: 'orders-shipping', href: '/help/faq' },
  { title: 'How to initiate a return', description: 'Step-by-step process for returning products.', category: 'returns-refunds', href: '/help/faq' },
  { title: 'Refund processing timeline', description: 'How long refunds take and where to check status.', category: 'returns-refunds', href: '/help/faq' },
  { title: 'Keeping your account secure', description: 'Best practices for account security and password management.', category: 'security', href: '/help/faq' },
  { title: 'Reporting suspicious activity', description: 'How to report fraud, scams, or security concerns.', category: 'security', href: '/help/faq' },
  { title: 'Browser and system requirements', description: 'Supported browsers and system requirements for TRADINGO.', category: 'technical-support', href: '/help/faq' },
  { title: 'Troubleshooting common issues', description: 'Solutions to frequently encountered technical problems.', category: 'technical-support', href: '/help/faq' },
];

const popularTopics = [
  { title: 'How to reset your password', href: '/help/faq' },
  { title: 'Seller commission rates explained', href: '/help/faq' },
  { title: 'Order cancellation policy', href: '/help/faq' },
  { title: 'GOCASH rewards program', href: '/help/faq' },
  { title: 'GST invoicing guide', href: '/help/faq' },
  { title: 'Supplier verification process', href: '/help/faq' },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = searchQuery.length === 0 || article.title.toLowerCase().includes(searchQuery.toLowerCase()) || article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <PageHeader
        title="Help Center"
        description="Find answers, browse guides, and get support."
      />

      <section className="py-8">
        <div className="container-main">
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface py-3 pl-12 pr-4 text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="container-main">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`rounded-xl border p-5 text-left transition-all ${
                    activeCategory === cat.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-surface hover:border-accent/50'
                  }`}
                >
                  <div className="mb-3 text-accent">{cat.icon}</div>
                  <h3 className="mb-1 font-semibold text-text-primary">{cat.title}</h3>
                  <p className="text-sm text-text-secondary">{cat.description}</p>
                </button>
              ))}
            </div>

            <div className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-text-primary">
                  {activeCategory
                    ? `Articles in ${categories.find((c) => c.id === activeCategory)?.title}`
                    : 'All Help Articles'}
                </h2>
                {activeCategory && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className="text-sm text-accent hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              {filteredArticles.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface p-8 text-center">
                  <p className="text-text-secondary">No articles found matching your search.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredArticles.map((article) => (
                    <Link
                      key={article.title}
                      href={article.href}
                      className="group rounded-xl border border-border bg-surface p-5 transition-all hover:border-accent/50 hover:bg-surface-secondary"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-medium text-text-primary group-hover:text-accent">{article.title}</h3>
                        <ChevronRight className="mt-0.5 h-4 w-4 text-text-tertiary group-hover:text-accent" />
                      </div>
                      <p className="mb-3 text-sm text-text-secondary">{article.description}</p>
                      <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                        {categories.find((c) => c.id === article.category)?.title || article.category}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-12 rounded-xl border border-border bg-surface p-6">
              <h2 className="mb-4 text-xl font-bold text-text-primary">Popular Topics</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {popularTopics.map((topic) => (
                  <Link
                    key={topic.title}
                    href={topic.href}
                    className="group flex items-center gap-2 rounded-lg p-2 transition-all hover:bg-surface-secondary"
                  >
                    <ExternalLink className="h-4 w-4 text-accent" />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary">{topic.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABlock
        title="Need More Help?"
        subtitle="Our support team is available 24/7 to assist you with any questions or concerns."
        primaryLabel="Contact Support"
        primaryHref="/contact"
        secondaryLabel="Visit FAQ"
        secondaryHref="/help/faq"
        variant="simple"
      />
    </>
  );
}

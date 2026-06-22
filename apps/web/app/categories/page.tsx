import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { FeatureCards } from '@/components/shared/feature-cards';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Browse Categories | TRADINGO',
  description:
    'Navigate TRADINGO\'s comprehensive category structure to find products faster.',
};

const categories = [
  {
    icon: '🏭',
    title: 'Raw Materials',
    description: 'Metals, plastics, chemicals, and other raw industrial materials for manufacturing.',
  },
  {
    icon: '🔧',
    title: 'Industrial Supplies',
    description: 'Tools, equipment, safety gear, and maintenance supplies for industrial operations.',
  },
  {
    icon: '💻',
    title: 'Electronics',
    description: 'Electronic components, devices, semiconductors, and consumer electronics.',
  },
  {
    icon: '👕',
    title: 'Textiles',
    description: 'Fabrics, yarns, garments, and textile raw materials for the fashion industry.',
  },
  {
    icon: '🧪',
    title: 'Chemicals',
    description: 'Industrial chemicals, solvents, adhesives, and specialty chemical products.',
  },
  {
    icon: '📦',
    title: 'Packaging',
    description: 'Packaging materials, containers, labels, and printing solutions.',
  },
  {
    icon: '🚗',
    title: 'Automotive',
    description: 'Vehicle parts, accessories, lubricants, and automotive service equipment.',
  },
  {
    icon: '🍔',
    title: 'Food & Beverages',
    description: 'Processed foods, beverages, ingredients, and food processing equipment.',
  },
  {
    icon: '🏗️',
    title: 'Construction',
    description: 'Building materials, hardware, fixtures, and construction equipment.',
  },
  {
    icon: '🏥',
    title: 'Healthcare',
    description: 'Medical equipment, pharmaceuticals, healthcare supplies, and laboratory products.',
  },
  {
    icon: '🌾',
    title: 'Agriculture',
    description: 'Farm equipment, seeds, fertilizers, and agricultural supplies.',
  },
  {
    icon: '🪑',
    title: 'Furniture',
    description: 'Office furniture, home furnishings, and commercial interior solutions.',
  },
  {
    icon: '✏️',
    title: 'Stationery',
    description: 'Office supplies, paper products, writing instruments, and school supplies.',
  },
  {
    icon: '🦺',
    title: 'Safety Equipment',
    description: 'Personal protective equipment, fire safety gear, and industrial safety solutions.',
  },
  {
    icon: '🚚',
    title: 'Logistics',
    description: 'Warehousing, transportation, shipping supplies, and logistics services.',
  },
];

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Product Categories"
        description="Navigate TRADINGO's comprehensive category structure to find products faster."
      />

      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="All Categories"
            subtitle="Explore our comprehensive range of product categories."
          />
          <FeatureCards features={categories} columns={3} />
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="Need Help Choosing?"
                subtitle="Our category experts can help you find the right products and suppliers for your business."
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { label: '10,000+', desc: 'Products Listed' },
                  { label: '2,000+', desc: 'Subcategories' },
                  { label: '500+', desc: 'Cities Covered' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{item.label}</p>
                    <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CTABlock
        title="Ready to Start Browsing?"
        subtitle="Create your free account and explore thousands of products across all categories."
        primaryLabel="Get Started"
        primaryHref="/register"
        secondaryLabel="Browse Products"
        secondaryHref="/products"
        variant="accent"
      />
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Browse Products | TRADINGO',
  description:
    'Explore thousands of products across multiple categories on TRADINGO TEM E-Marketplace.',
};

const categories = [
  { name: 'Industrial Machinery', count: '12,000+' },
  { name: 'Electronics & Electrical', count: '8,500+' },
  { name: 'Textiles & Fabrics', count: '6,200+' },
  { name: 'Chemicals & Pharmaceuticals', count: '4,800+' },
  { name: 'Packaging & Printing', count: '5,100+' },
  { name: 'Automotive & Spare Parts', count: '7,300+' },
  { name: 'Food & Agro Processing', count: '3,900+' },
  { name: 'Construction & Building Materials', count: '6,700+' },
  { name: 'IT & Electronics', count: '9,200+' },
  { name: 'Healthcare & Medical', count: '3,400+' },
];

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Browse Products"
        description="Explore thousands of products across multiple categories on TRADINGO TEM E-Marketplace."
      />

      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="All Categories"
            subtitle="Find exactly what you need from our extensive product catalog."
            viewMoreHref="/categories"
            viewMoreLabel="Browse All Categories"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href="/categories"
                className="group rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 dark:bg-dark-surface dark:border-dark-border"
              >
                <h3 className="font-semibold text-text-primary group-hover:text-primary-600 dark:text-dark-text-primary dark:group-hover:text-primary-400">
                  {cat.name}
                </h3>
                <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                  {cat.count} products
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-primary-400">
                  Browse Products <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-4xl text-center">
              <SectionHeader
                title="Popular Categories"
                subtitle="Discover our most active product categories with the highest buyer engagement."
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[
                  { name: 'Industrial Machinery', desc: 'Drills, lathes, CNC machines, and more', count: '12,000+' },
                  { name: 'Electronics & Electrical', desc: 'Components, devices, and electrical supplies', count: '8,500+' },
                  { name: 'Automotive & Spare Parts', desc: 'Vehicle parts, accessories, and tools', count: '7,300+' },
                ].map((item) => (
                  <div key={item.name} className="rounded-xl border border-border bg-surface p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{item.count}</p>
                    <h3 className="mt-2 font-semibold text-text-primary dark:text-dark-text-primary">{item.name}</h3>
                    <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CTABlock
        title="Can't Find What You're Looking For?"
        subtitle="Post an RFQ and let sellers come to you with competitive quotes."
        primaryLabel="Post a Requirement"
        primaryHref="/rfq"
        secondaryLabel="Browse Categories"
        secondaryHref="/categories"
        variant="accent"
      />
    </>
  );
}

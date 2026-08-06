'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { TRADESERV_CATEGORIES } from '@/lib/data/tradeserv';
import { SectionHeader } from '@/components/shared/section-header';
import { useEnrichedCategories } from '@/hooks/use-tradeserv';

function CategoryCard({
  cat,
  index,
  mapped,
}: {
  cat: (typeof TRADESERV_CATEGORIES)[number];
  index: number;
  mapped: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Link
        href={`/tradeserv/c/${cat.slug}`}
        className="group relative block h-full overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-accent/30 hover:bg-surface-secondary hover:shadow-lg hover:shadow-accent/5"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative z-10">
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-2xl backdrop-blur-sm">
            {cat.icon}
          </span>
          <div className="mt-4 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-text-primary">{cat.title}</h3>
            {mapped && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <CheckCircle className="h-2.5 w-2.5" />
                Catalog
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-tertiary">{cat.shortDescription}</p>
        </div>
      </Link>
    </motion.div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export default function CategoriesPage() {
  const { data: enrichedData } = useEnrichedCategories();

  const mappedCategories = new Set(
    (enrichedData || [])
      .filter((e) => e.catalogCategory !== null)
      .map((e) => e.category.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-bg-base">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)',
        }}
      />
      <div className="relative z-10">
        <section className="py-24 sm:py-32">
          <div className="container-main">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <SectionHeader
                title="Professional Service Categories"
                subtitle="Choose from 10 verified categories — each professional is TRADTRUST-verified for quality and reliability."
              />
            </motion.div>

            <motion.div
              className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {TRADESERV_CATEGORIES.map((cat, i) => (
                <CategoryCard key={cat.slug} cat={cat} index={i} mapped={mappedCategories.has(cat.title.toLowerCase())} />
              ))}
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

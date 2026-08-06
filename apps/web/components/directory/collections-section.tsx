'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Layers } from 'lucide-react'
import { useCategoryTree } from '@/hooks/use-categories'
import { SectionShell, DirHeader, SectionError, EmptyNote } from './primitives'

export function CollectionsSection() {
  const categoryTree = useCategoryTree()

  const collections = useMemo(() => {
    const t: any = categoryTree.data
    const nodes = Array.isArray(t) ? t : (t?.data ?? [])
    return [...nodes]
      .sort((a: any, b: any) => (b._count?.products ?? 0) - (a._count?.products ?? 0))
      .slice(0, 8)
  }, [categoryTree.data])

  return (
    <SectionShell>
      <DirHeader
        title="Business Collections"
        subtitle="Curated groupings of the TRADINGO catalog — derived live from category data."
        viewMoreHref="/categories"
        viewMoreLabel="All Categories"
      />

      {categoryTree.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl border border-border bg-surface" />
          ))}
        </div>
      ) : categoryTree.isError ? (
        <SectionError label="collections" onRetry={() => categoryTree.refetch()} />
      ) : collections.length === 0 ? (
        <EmptyNote
          icon={<Layers className="h-6 w-6" />}
          text="Collections will appear here once categories are populated."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collections.map((cat: any, i: number) => (
            <motion.div
              key={`col-${cat.id}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <Link
                href={`/categories/${cat.slug}`}
                className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-6 transition-all duration-300 hover:border-accent/20 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Layers className="h-5 w-5" />
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-text-tertiary transition-all group-hover:translate-x-1 group-hover:text-accent"
                  />
                </div>
                <h3 className="mt-4 font-semibold text-text-primary transition-colors group-hover:text-accent">
                  {cat.name}
                </h3>
                <p className="mt-1 text-xs text-text-tertiary">
                  {cat._count?.products ?? 0} products · {cat._count?.children ?? 0} sub-categories
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

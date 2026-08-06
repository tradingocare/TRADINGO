'use client'

import { PageHeader } from '@/components/shared/page-header'
import { Factory, ArrowRight, Users, Package, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useIndustries } from '@/hooks/use-industries'

export default function IndustriesPage() {
  const { data, isLoading, error } = useIndustries()
  const industries = data?.data ?? []

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-bg-base flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-status-error mx-auto mb-3" />
          <p className="text-text-primary font-semibold mb-1">Failed to load industries</p>
          <p className="text-text-tertiary text-sm">Please try again later</p>
        </div>
      </div>
    )
  }

  if (industries.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-bg-base flex items-center justify-center">
        <p className="text-text-tertiary">No industries found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-bg-base">
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader
          title="Industries We Serve"
          description="Connecting businesses across India's key industrial sectors."
        />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <Link key={industry.slug} href={`/industry/${industry.slug}`}>
              <div
                className="group h-full rounded-3xl p-6 bg-surface backdrop-blur-xl border border-border transition-all duration-300 hover:border-accent/20 hover:shadow-xl"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Factory className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {industry.name}
                </h3>
                <p className="mt-2 text-sm text-text-secondary line-clamp-2">
                  {industry.description ?? `${industry.name} industry on TRADINGO`}
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <span className="flex items-center gap-1 text-xs text-text-tertiary">
                    <Package className="h-3.5 w-3.5" />
                    {industry._count.products.toLocaleString()} products
                  </span>
                  <span className="flex items-center gap-1 text-xs text-text-tertiary">
                    <Users className="h-3.5 w-3.5" />
                    {industry._count.companies} suppliers
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent/70 group-hover:text-accent transition-colors">
                  Explore
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

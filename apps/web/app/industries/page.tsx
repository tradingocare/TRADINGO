'use client'

import { PageHeader } from '@/components/shared/page-header'
import { Factory, ArrowRight, Users, Package } from 'lucide-react'
import Link from 'next/link'
import { CATALOG_CATEGORIES } from '@/data/catalog-data'

const industries = CATALOG_CATEGORIES.map(c => ({
  slug: c.slug,
  name: c.name,
  description: `${c.subcategories.length} subcategories · ${c.productCount} products · ${c.serviceCount} services`,
  products: c.productCount + c.serviceCount,
  suppliers: c.supplierCount,
}))

export default function IndustriesPage() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader
          title="Industries We Serve"
          description="Connecting businesses across India's key industrial sectors."
        />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <Link key={industry.slug} href={`/industry/${industry.slug}`}>
              <div
                className="group h-full rounded-3xl p-6 transition-all duration-300 hover:border-[#FF4D00]/20 hover:shadow-[0_0_30px_-5px_rgba(255,77,0,0.15)]"
                style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF4D00]/10 text-[#FF4D00]">
                  <Factory className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white group-hover:text-[#FF4D00] transition-colors">
                  {industry.name}
                </h3>
                <p className="mt-2 text-sm text-white/50 line-clamp-2">{industry.description}</p>
                <div className="mt-4 flex items-center gap-4">
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Package className="h-3.5 w-3.5" />
                    {industry.products.toLocaleString()} products
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Users className="h-3.5 w-3.5" />
                    {industry.suppliers} suppliers
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#FF4D00]/70 group-hover:text-[#FF4D00] transition-colors">
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

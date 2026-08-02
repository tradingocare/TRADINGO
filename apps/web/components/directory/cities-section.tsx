'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, MapPin, Navigation } from 'lucide-react'
import CompanyCard from '@/components/company/CompanyCard'
import { MASTER_CITIES } from '@/data/master-data'
import { useGeoLocation } from '@/hooks/use-geolocation'
import { getSellers } from '@/lib/api/near-me'
import { SectionShell, DirHeader, SectionError, EmptyNote } from './primitives'
import { cn } from '@/lib/utils'

type TabId = 'popular' | 'az' | 'nearme'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'popular', label: 'Popular', icon: <MapPin size={13} /> },
  { id: 'az', label: 'A–Z', icon: <MapPin size={13} /> },
  { id: 'nearme', label: 'Near Me', icon: <Navigation size={13} /> },
]

export function CitiesSection() {
  const [tab, setTab] = useState<TabId>('popular')
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeoLocation()

  const nearMeQuery = useQuery({
    queryKey: ['directory-cities-nearme', location?.lat, location?.lng],
    queryFn: () => getSellers(location!.lat, location!.lng, 25),
    enabled: !!location,
    staleTime: 120_000,
  })

  const azCities = useMemo(() => [...MASTER_CITIES].sort((a, b) => a.name.localeCompare(b.name)), [])
  const popularCities = MASTER_CITIES.slice(0, 15)

  const renderCityGrid = (cities: typeof MASTER_CITIES) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cities.map((city: any, i: number) => (
        <motion.div
          key={city.slug}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: Math.min(i * 0.02, 0.3) }}
        >
          <Link
            href={`/city/${city.slug}`}
            className="group relative block overflow-hidden rounded-2xl border border-border"
          >
            <div className="relative h-28">
              {city.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={city.image}
                  alt={city.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-surface" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="font-bold text-white">{city.name}</h3>
                <p className="text-[11px] text-white/80">{city.state}</p>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )

  return (
    <SectionShell>
      <DirHeader
        title="Explore by City"
        subtitle="Find local suppliers across India — popular, alphabetical, or near you."
        viewMoreHref="/products"
        viewMoreLabel="Browse Products"
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all',
              tab === t.id
                ? 'border-accent bg-accent text-white shadow-lg'
                : 'border-border bg-surface text-text-secondary hover:border-accent/30 hover:text-text-primary',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'popular' && renderCityGrid(popularCities)}

      {tab === 'az' && (
        <div className="rounded-3xl border border-border bg-surface p-6">
          <div className="flex flex-wrap gap-2">
            {azCities.map((city: any) => (
              <Link
                key={city.slug}
                href={`/city/${city.slug}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-base px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
              >
                <MapPin size={13} className="text-text-tertiary" />
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === 'nearme' && (
        <div>
          {!location && (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center">
              <Navigation className="mx-auto h-10 w-10 text-accent" />
              <p className="mt-3 text-text-tertiary">
                {geoError ? `Location unavailable: ${geoError}` : 'Allow location access to see nearby suppliers.'}
              </p>
              <button
                onClick={requestLocation}
                disabled={geoLoading}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:opacity-60"
              >
                {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                Use My Location
              </button>
            </div>
          )}

          {location && nearMeQuery.isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-56 rounded-3xl border border-border bg-surface" />
              ))}
            </div>
          )}

          {location && nearMeQuery.isError && (
            <SectionError label="nearby suppliers" onRetry={() => nearMeQuery.refetch()} />
          )}

          {location && nearMeQuery.data && nearMeQuery.data.length === 0 && (
            <EmptyNote
              icon={<MapPin className="h-6 w-6" />}
              text="No suppliers within 25 km yet — expand your search on the products page."
              actionHref="/products"
              actionLabel="Browse All Products"
            />
          )}

          {location && nearMeQuery.data && nearMeQuery.data.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {nearMeQuery.data.map((seller: any, i: number) => (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <CompanyCard
                    company={{
                      id: seller.id,
                      name: seller.name ?? 'Supplier',
                      slug: seller.slug ?? '',
                      logo: seller.logo ?? null,
                      bannerUrl: seller.bannerUrl ?? seller.banner ?? null,
                      description: seller.description ?? null,
                      city: seller.city ?? '',
                      state: seller.state ?? '',
                      categories: Array.isArray(seller.categories) ? seller.categories : [],
                      isVerified: !!(seller.verificationLevel && seller.verificationLevel !== 'LEVEL_0'),
                      isTradgoElite: !!seller.isTradgoElite,
                      trustScore: Number(seller.trustScore ?? 0),
                      rating: Number(seller.rating ?? 0),
                      reviewCount: Number(seller.reviewCount ?? 0),
                      productCount: Number(seller.productCount ?? 0),
                      yearsActive: Number(seller.yearsActive ?? 0),
                      isGstVerified: !!seller.gstVerified,
                    } as any}
                    index={i}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </SectionShell>
  )
}

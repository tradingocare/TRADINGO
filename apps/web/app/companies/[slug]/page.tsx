import type { Metadata } from 'next'
import CompanyProfileClient from './CompanyProfileClient'
import {
  buildCompanyJsonLd,
  buildCompanyBreadcrumbJsonLd,
  serializeJsonLd,
  type CompanyLike,
} from '@/lib/seo/company-json-ld'

/**
 * Existing company detail route (audit-confirmed — NOT a new route).
 * Product Card and Product Detail already link here as /companies/{slug}.
 *
 * SEO additions (real company data only): canonical, Twitter card and
 * Organization + BreadcrumbList JSON-LD. The visible page itself remains
 * CompanyProfileClient (unchanged data flow).
 */

async function fetchCompany(slug: string): Promise<(CompanyLike & Record<string, any>) | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    const res = await fetch(`${apiUrl}/companies/${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    const d = await res.json()
    return d?.data || d
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params
    const c = await fetchCompany(slug)
    if (c) {
      const description = c.tagline || c.description || undefined
      const images = c.banner ? [c.banner] : []
      return {
        // The root layout appends "| TRADINGO" — never repeat the brand here.
        title: `${c.name} — Verified Supplier`,
        description: description || `View ${c.name}'s profile on TRADINGO.`,
        alternates: {
          canonical: `https://tradingo.in/companies/${slug}`,
        },
        openGraph: {
          title: `${c.name} | TRADINGO Supplier`,
          description,
          images,
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `${c.name} | TRADINGO Supplier`,
          description,
          images,
        },
      }
    }
  } catch (e) { console.error('Failed to fetch company metadata:', e) }
  return { title: 'Company Profile — TRADINGO' }
}

export function generateStaticParams() {
  return []
}

export const dynamic = 'force-dynamic'

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const company = await fetchCompany(slug)

  return (
    <>
      {company ? (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildCompanyJsonLd(company, slug)) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildCompanyBreadcrumbJsonLd(String(company.name || ''), slug)) }}
          />
        </>
      ) : null}
      <CompanyProfileClient slug={slug} />
    </>
  )
}

import type { Metadata } from 'next'
import CompanyProfileClient from './CompanyProfileClient'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    const res = await fetch(`${apiUrl}/companies/${slug}`, { cache:'no-store' })
    if (res.ok) {
      const d = await res.json()
      const c = d.data || d
      return {
        title: `${c.name} — Verified Supplier on TRADINGO`,
        description: c.tagline || c.description || `View ${c.name}'s profile on TRADINGO.`,
        openGraph: { title: `${c.name} | TRADINGO Supplier`, images: c.banner ? [c.banner] : [] },
      }
    }
  } catch (e) { console.error('Failed to fetch company metadata:', e) }
  return { title: 'Company Profile — TRADINGO' }
}

export function generateStaticParams() {
  return []
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <CompanyProfileClient slug={slug} />
}

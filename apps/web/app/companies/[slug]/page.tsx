import type { Metadata } from 'next'
import CompanyProfileClient from './CompanyProfileClient'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    const res = await fetch(`${apiUrl}/companies/${params.slug}`, { cache:'no-store' })
    if (res.ok) {
      const d = await res.json()
      const c = d.data || d
      return {
        title: `${c.name} — Verified Supplier on TRADINGO`,
        description: c.tagline || c.description || `View ${c.name}'s profile on TRADINGO.`,
        openGraph: { title: `${c.name} | TRADINGO Supplier`, images: c.banner ? [c.banner] : [] },
      }
    }
  } catch {}
  return { title: 'Company Profile — TRADINGO' }
}

export default function CompanyPage({ params }: { params: { slug: string } }) {
  return <CompanyProfileClient slug={params.slug} />
}

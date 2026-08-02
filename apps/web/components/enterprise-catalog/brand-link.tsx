'use client'

import { ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BrandLinkProps {
  brandName: string
  verified?: boolean
  className?: string
}

export function BrandLink({ brandName, verified, className }: BrandLinkProps) {
  const router = useRouter()
  if (!brandName) return null
  return (
    <button
      onClick={() => router.push(`/search?q=${encodeURIComponent(brandName)}&brand=true`)}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline transition-colors ${className || ''}`}
    >
      {brandName}
      {verified && <ShieldCheck className="h-3.5 w-3.5 text-status-success" />}
    </button>
  )
}

'use client'

import { ShieldCheck, Globe, MapPin, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrandCardProps {
  name: string
  logo?: string | null
  country?: string | null
  description?: string | null
  verificationStatus?: string
  manufacturer?: string | null
  website?: string | null
  className?: string
}

export function BrandCard({ name, logo, country, description, verificationStatus, manufacturer, website, className }: BrandCardProps) {
  const isVerified = verificationStatus === 'VERIFIED'
  return (
    <div className={cn('rounded-xl border border-border bg-surface p-4', className)}>
      <div className="flex items-start gap-4">
        {logo ? (
          <img src={logo} alt={name} className="h-14 w-14 rounded-lg object-cover border border-border" />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-bg-elevated flex items-center justify-center border border-border">
            <Award className="h-6 w-6 text-text-tertiary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-text-primary truncate">{name}</h3>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-status-success bg-status-success/10 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
          {manufacturer && <p className="text-xs text-text-tertiary mt-0.5">{manufacturer}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            {country && (
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <MapPin className="h-3 w-3" /> {country}
              </span>
            )}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
                <Globe className="h-3 w-3" /> Website
              </a>
            )}
          </div>
        </div>
      </div>
      {description && <p className="text-sm text-text-secondary mt-3 line-clamp-2">{description}</p>}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { SectionHeader } from '@/components/shared/section-header'
import { cn } from '@/lib/utils'

const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'

/**
 * Scalable section shell. `content-visibility:auto` defers layout/paint of
 * off-screen sections — cheap virtualization without a library.
 */
export function SectionShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'py-14 [content-visibility:auto] [contain-intrinsic-size:auto_1200px]',
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4">{children}</div>
    </section>
  )
}

export function DirHeader(props: {
  title: string
  subtitle?: string
  viewMoreHref?: string
  viewMoreLabel?: string
  extra?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <SectionHeader title={props.title} subtitle={props.subtitle} align="left" className="mb-0" />
      <div className="flex items-center gap-3">
        {props.extra}
        {props.viewMoreHref && (
          <Link
            href={props.viewMoreHref}
            className="group inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent"
          >
            {props.viewMoreLabel ?? 'View All'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </div>
  )
}

export function SkeletonCards({
  count = 8,
  variant = 'product',
}: {
  count?: number
  variant?: 'product' | 'tall' | 'wide'
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-3xl border border-border bg-surface',
            variant === 'tall' && 'h-36',
            variant === 'wide' && 'h-44',
            variant === 'product' && 'p-5',
            shimmer,
          )}
        >
          {variant === 'product' && (
            <>
              <div className="h-40 rounded-xl bg-surface" />
              <div className="mt-4 h-4 w-3/4 rounded-full bg-surface" />
              <div className="mt-2 h-5 w-1/3 rounded-full bg-surface" />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export function SectionError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-status-error" />
      <p className="mt-3 font-semibold text-text-primary">Failed to load {label}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-sm font-medium text-white transition-all hover:brightness-110"
      >
        ↻ Retry
      </button>
    </div>
  )
}

export function EmptyNote({
  icon,
  text,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode
  text: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
        {icon}
      </div>
      <p className="mt-3 text-text-tertiary">{text}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-accent/30 hover:text-accent"
        >
          {actionLabel} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}

export function ViewMoreButton({
  remaining,
  onClick,
  loading,
}: {
  remaining: number
  onClick: () => void
  loading?: boolean
}) {
  return (
    <div className="mt-10 text-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-6 py-2.5 text-sm font-semibold text-accent transition-all hover:bg-accent/20 disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        View {remaining > 0 ? `${Math.min(remaining, 24)}+ More` : 'More'}
      </button>
    </div>
  )
}

export function InfiniteSentinel({
  ref,
  visible,
  loading,
}: {
  ref: React.RefObject<HTMLDivElement | null>
  visible: boolean
  loading?: boolean
}) {
  if (!visible) return null
  return (
    <div ref={ref} className="mt-10 flex items-center justify-center py-4">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <Loader2 size={16} className="animate-spin text-accent" /> Loading more…
        </div>
      )}
    </div>
  )
}

export { shimmer }

import Link from 'next/link'

export default function InvalidPlanContext({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
          <h1 className="mb-2 text-xl font-bold text-text-primary">Invalid plan selection</h1>
          <p className="mb-6 text-sm text-text-secondary">{error}</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/plans"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-btn-primary-text transition-opacity hover:opacity-90"
            >
              Back to Plans
            </Link>
            <Link
              href="/register/vendor"
              className="text-sm font-semibold text-accent hover:underline"
            >
              Continue without a preselected plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

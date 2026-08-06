export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-t-accent border-border animate-spin mx-auto mb-4" />
        <p className="text-text-tertiary text-sm">Loading directory...</p>
      </div>
    </div>
  )
}

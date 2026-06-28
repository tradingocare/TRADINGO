export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#1D0001' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-t-[#FF4D00] border-white/10 animate-spin mx-auto mb-4" />
        <p className="text-white/40 text-sm">Loading...</p>
      </div>
    </div>
  )
}

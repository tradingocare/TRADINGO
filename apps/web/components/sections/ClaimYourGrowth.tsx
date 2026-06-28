export default function ClaimYourGrowth() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-[rgba(255,77,0,0.03)] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.02)] blur-[100px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
        <div
          className="rounded-3xl p-10 sm:p-16"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <img
            src="/logo/trdn.png"
            alt="TRADINGO"
            className="mx-auto h-10 w-auto opacity-70 sm:h-12"
          />

          <h2 className="mt-6 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
            Ready to Grow Your Business?
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-white/50 sm:text-base">
            Join TRADINGO&trade; &ndash; India&apos;s Smart Trade Ecosystem.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/40">
            Create your FREE account and unlock a world of opportunities. Discover verified buyers and sellers, list your products and services with 0% commission, receive genuine RFQs, connect directly with businesses, and expand from local markets to global trade through the power of the TRADHEXA&trade; 6-Engine Framework.
          </p>
          <p className="mx-auto mt-4 text-sm font-semibold text-white/60">
            Start trading smarter. Build trusted connections. Grow without limits.
          </p>
          <p className="mx-auto mt-2 text-xs text-[#D4AF37]/70">
            🚀 Join Free Today and Turn Every Opportunity into Business Growth.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] font-medium text-white/40">
            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1">0% Commission</span>
            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1">Verified Businesses</span>
            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1">Smart RFQs</span>
            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1">Near-to-Far Trade</span>
            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1">Powered by TRADHEXA&trade; 🌍✨</span>
          </div>

          <div className="mt-8 flex flex-nowrap items-center justify-center gap-2">
            <a
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all hover:scale-105 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #F2C94C)',
                color: '#1a1a1a',
                boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
              }}
            >
              🟡 Create Free Account
            </a>
            <a
              href="/trading"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all hover:scale-105 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              ⚫ Explore Marketplace
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all hover:scale-105 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
              style={{
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: '#4ade80',
              }}
            >
              🟢 Become a Seller
            </a>
            <a
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all hover:scale-105 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#60a5fa',
              }}
            >
              🔵 Browse as Buyer
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

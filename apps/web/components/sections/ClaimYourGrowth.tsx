export default function ClaimYourGrowth() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-[rgba(0,255,255,0.03)] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[rgba(0,255,255,0.02)] blur-[100px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-[1600px] px-4 text-center">
        <div className="glass-panel-prism p-10 sm:p-16">
          <img
            src="/logo/trdn.png"
            alt="TRADINGO"
            className="mx-auto h-10 w-auto opacity-70 sm:h-12"
          />

          <h2 className="mt-6 text-3xl font-black text-primary sm:text-4xl lg:text-5xl bg-gradient-to-r from-[var(--text-primary)] via-[var(--text-secondary)] to-[var(--text-tertiary)] bg-clip-text text-transparent">
            Ready to Grow Your Business?
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-accent-500 sm:text-base">
            Join TRADINGO&trade; &ndash; India&apos;s Smart Trade Ecosystem.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">
            Create your FREE account and unlock a world of opportunities. Discover verified buyers and sellers, list your products and services with 0% commission, receive genuine RFQs, connect directly with businesses, and expand from local markets to global trade through the power of the TRADHEXA&trade; 6-Engine Framework.
          </p>
          <p className="mx-auto mt-4 text-sm font-semibold text-text-primary">
            Start trading smarter. Build trusted connections. Grow without limits.
          </p>
          <p className="mx-auto mt-2 text-xs font-bold text-accent-500 drop-shadow-[0_0_10px_rgba(255,77,0,0.2)]">
            🚀 Join Free Today and Turn Every Opportunity into Business Growth.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] font-medium text-text-tertiary">
            <span className="rounded-full border border-border bg-surface-secondary px-3 py-1">0% Commission</span>
            <span className="rounded-full border border-border bg-surface-secondary px-3 py-1">Verified Businesses</span>
            <span className="rounded-full border border-border bg-surface-secondary px-3 py-1">Smart RFQs</span>
            <span className="rounded-full border border-border bg-surface-secondary px-3 py-1">Near-to-Far Trade</span>
            <span className="rounded-full border border-border bg-surface-secondary px-3 py-1">Powered by TRADHEXA&trade; 🌍✨</span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--accent-dark)] to-[var(--accent)] px-6 py-3 text-xs font-bold text-primary transition-all hover:scale-105 hover:shadow-[0_4px_20px_rgba(255,77,0,0.4)] sm:gap-2 sm:px-8 sm:py-3.5 sm:text-sm"
            >
              🟡 Create Free Account
            </a>
            <a
              href="/trading"
              className="btn-glass inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-xs font-semibold transition-all hover:scale-105 sm:gap-2 sm:px-8 sm:py-3.5 sm:text-sm"
            >
              ⚫ Explore Marketplace
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-6 py-3 text-xs font-semibold text-green-400 transition-all hover:scale-105 hover:bg-green-500/20 sm:gap-2 sm:px-8 sm:py-3.5 sm:text-sm"
            >
              🟢 Become a Seller
            </a>
            <a
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-6 py-3 text-xs font-semibold text-blue-400 transition-all hover:scale-105 hover:bg-blue-500/20 sm:gap-2 sm:px-8 sm:py-3.5 sm:text-sm"
            >
              🔵 Browse as Buyer
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

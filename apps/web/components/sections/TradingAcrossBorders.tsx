'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronRight, ShieldCheck, Handshake, Zap } from 'lucide-react';

const countries = [
  { code: 'IN', name: 'India' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'NP', name: 'Nepal' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'AF', name: 'Afghanistan' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'RU', name: 'Russia' },
  { code: 'AE', name: 'UAE (Dubai)' },
];

export default function TradingAcrossBorders() {
  const [selected, setSelected] = useState('India');

  const handleClick = (name: string) => {
    setSelected(name);
  };

  const selectedCountry = countries.find(c => c.name === selected) || countries[0];
  const selectedCountryCode = selectedCountry.code;

  return (
    <section className="relative overflow-hidden py-14 sm:py-16 lg:py-20" style={{ background: 'var(--bg-base)' }}>
      {/* Background Gradients & Glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full bg-[rgba(0,180,255,0.03)] blur-[120px]" />
        <div className="absolute -right-40 bottom-1/4 h-[400px] w-[400px] rounded-full bg-[rgba(168,85,247,0.03)] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12">
        
        {/* Top Feature Info Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-[1600px] text-center"
        >
          <div className="glass-panel-prism px-5 py-6 sm:px-8 sm:py-8 lg:px-12 mb-8">
            <img
              src="/logo/trdn5.png"
              alt="TRADINGO"
              className="mx-auto h-20 w-auto opacity-90 sm:h-24 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            />

            <div className="relative z-10 mt-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Trading Across Borders
              </span>

              <h2 className="mt-4 text-2xl font-extrabold leading-[1.15] tracking-tight text-primary sm:text-3xl lg:text-5xl">
                The Future of{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[#ff4d00]">
                  Global Trade
                </span>{' '}
                Starts Here
              </h2>

              <div className="mt-3 flex items-center justify-center gap-4">
                <span className="h-px w-6 bg-surface-tertiary" />
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-400/60 sm:text-sm">
                  One Intelligent Platform. Unlimited Global Opportunities.
                </p>
                <span className="h-px w-8 bg-surface-tertiary" />
              </div>

              <div className="mx-auto mt-6 w-full space-y-5">
                <p className="mx-auto max-w-7xl text-base leading-relaxed text-text-secondary sm:text-lg sm:text-justify">
                  TRADINGO is a{' '}
                  <span className="font-medium text-primary">global trade platform</span>{' '}
                  &mdash;a next-generation AI-powered trade ecosystem transforming
                  the way businesses connect, collaborate, and grow. By unifying buyers, manufacturers,
                  suppliers, distributors, exporters, importers, and professional service providers into
                  one trusted digital network, TRADINGO enables intelligent business discovery, verified
                  partnerships, enterprise collaboration, and seamless cross-border commerce.
                </p>
                <p className="mx-auto max-w-7xl text-base leading-relaxed text-text-secondary sm:text-lg sm:text-justify">
                  Driven by Trust, Technology, Intelligence, and Transparency, TRADINGO combines
                  artificial intelligence, real-time market intelligence, verified business networks,
                  and enterprise-grade digital infrastructure to make global trade more connected,
                  efficient, and secure.
                </p>
                <p className="mx-auto max-w-7xl text-base leading-relaxed text-text-secondary sm:text-lg sm:text-justify">
                  Starting in India and expanding across South Asia, Southeast Asia, the Middle East,
                  and global markets, TRADINGO is building the digital foundation for the next generation
                  of international commerce&mdash;where businesses of every size can connect, collaborate,
                  and succeed without borders.
                </p>
              </div>

              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="h-px w-48 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
                <div className="relative flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface-secondary px-6 py-3.5 max-w-2xl mx-auto">
                  <span className="text-sm font-semibold uppercase tracking-[0.15em] text-text-secondary sm:text-base">Born in</span>
                  <span className="text-base font-extrabold text-primary sm:text-lg">India,</span>
                  <span className="text-sm font-semibold uppercase tracking-[0.15em] text-text-secondary sm:text-base">Built for</span>
                  <span className="text-base font-extrabold text-amber-400 sm:text-lg">the World</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Region Selector - Premium Neon & Glass Layout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6"
        >
          {/* Header Block matching mockup */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/5 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Globe className="h-3 w-3 text-amber-400" />
              TRADING ACROSS BORDERS&trade;
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-primary sm:text-5xl">
              Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">Region</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-text-secondary">
                Born in India, Built for the World
            </p>
          </div>

          {/* Premium Flag Container matching mockup */}
          <div className="relative mx-auto max-w-[1600px]">
            {/* Under-card backlight ambient glow */}
            <div className="absolute -inset-1.5 rounded-[24px] bg-gradient-to-r from-blue-500/5 via-amber-500/10 to-purple-500/5 blur-xl opacity-90" />
            
            {/* The main elongated glass card pill */}
            <div className="relative rounded-[24px] border border-border bg-bg-elevated/40 backdrop-blur-2xl px-8 py-6 shadow-2xl">
              
              {/* Gold/Blue light streaks on top border */}
              <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
              <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

              <div 
                className="flex items-center justify-start gap-x-5 gap-y-0 overflow-x-auto flex-nowrap scrollbar-hide py-2 px-1 sm:justify-center"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {countries.map((country, i) => {
                  const isSelected = selected === country.name;
                  return (
                    <motion.button
                      key={country.name}
                      onClick={() => handleClick(country.name)}
                      whileHover={{ scale: 1.06 }}
                      className="group flex cursor-pointer flex-col items-center gap-3 bg-transparent p-0 outline-none"
                    >
                      {/* Flag circle wrapper */}
                      <div className="relative flex h-[50px] w-[50px] items-center justify-center sm:h-[60px] sm:w-[60px]">
                        {/* Selected golden glow circle ring or regular metallic ring */}
                        <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                          isSelected 
                            ? 'border-2 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.5)] scale-105' 
                            : 'border border-border bg-surface-secondary group-hover:border-border'
                        }`} />

                        {/* Inner gold border highlight for selected */}
                        {isSelected && (
                          <div className="absolute inset-[3px] rounded-full border border-amber-300/50" />
                        )}

                        {/* Flag image */}
                        <div className="h-[42px] w-[42px] overflow-hidden rounded-full sm:h-[50px] sm:w-[50px] relative z-10">
                          <img
                            src={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png`}
                            alt={country.name}
                            className="h-full w-full object-cover rounded-full"
                            loading="lazy"
                          />
                          {/* Top lighting sheen overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none" />
                        </div>
                      </div>

                      {/* Small gold dot indicator under selected */}
                      <div className="h-1 flex items-center justify-center relative -mt-1.5">
                        {isSelected ? (
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-pulse" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-transparent" />
                        )}
                      </div>

                      {/* Flag Label */}
                      <span className={`text-[10px] font-semibold tracking-wide transition-all duration-300 whitespace-nowrap ${
                        isSelected 
                          ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.45)] font-bold' 
                          : 'text-text-tertiary group-hover:text-text-secondary'
                      }`}>
                        {country.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mockup footer attributes */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-text-tertiary max-w-2xl mx-auto rounded-full border border-border bg-surface-secondary py-3 px-8">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-500/80" />
              <span className="font-medium text-primary/80">Secure</span>
            </div>
            <span className="text-primary/10">|</span>
            <div className="flex items-center gap-1.5">
              <Handshake className="h-4 w-4 text-amber-500/80" />
              <span className="font-medium text-primary/80">Transparent</span>
            </div>
            <span className="text-primary/10">|</span>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500/80" />
              <span className="font-medium text-primary/80">Smart</span>
            </div>
            <span className="text-primary/10">|</span>
            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-amber-500/80" />
              <span className="font-medium text-primary/80">Global</span>
            </div>
          </div>
        </motion.div>

        {/* Dynamic welcome / expansion status panel (rendered inline below flags) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface-secondary px-8 py-4 text-center max-w-[1600px] mx-auto backdrop-blur-md"
          >
            {/* Dynamic Flag Icon at the top */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
              <img
                src={`https://flagcdn.com/w160/${selectedCountryCode.toLowerCase()}.png`}
                alt={selected}
                className="h-full w-full object-cover rounded-full scale-105"
              />
            </div>

            {selected === 'India' ? (
              <>
                <h3 className="mt-4 text-2xl font-black text-primary sm:text-3xl">Welcome to TRADINGO India</h3>
                <p className="mx-auto mt-3 w-full max-w-7xl text-base leading-relaxed text-text-secondary sm:mt-4 sm:text-lg sm:text-justify">
                  India is our home and our launch market.
                  Connect with verified buyers, sellers, manufacturers, and distributors.
                  Discover high-value RFQs, unlock GOCASH rewards, participate in TRADGO.
                  Driven by Trust, Technology, Intelligence.
                  Starting in India and expanding globally.
                </p>
                <Link href="/trading">
                  <motion.span
                    whileHover={{ y: -2, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-[#ff4d00] px-6 py-3 text-sm font-bold text-primary shadow-lg shadow-[#ff4d00]/20 cursor-pointer"
                  >
                    Explore India Marketplace <ChevronRight size={16} />
                  </motion.span>
                </Link>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-3xl font-black text-primary">Welcome to the TRADINGO Family</h3>
                <p className="mt-1 text-sm font-semibold text-amber-400/80 sm:text-base">Global Expansion in Progress ({selected})</p>

                <div className="mx-auto mt-6 w-full space-y-4 text-base leading-relaxed text-text-secondary sm:text-lg">
                  <p>Thank you for your interest in TRADINGO.</p>
                  <p>
                    TRADINGO &ndash; The Global Smart B2B Marketplace is currently launched in India and is progressively expanding into international markets.
                  </p>
                  <p>
                    We are actively preparing localized experiences for your region and look forward to welcoming you very soon.
                  </p>
                  <p className="text-text-secondary font-medium">
                    We sincerely appreciate your patience and support.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-[#ff4d00] px-6 py-2.5 text-sm font-bold text-primary transition-all hover:shadow-lg hover:shadow-[#ff4d00]/25 cursor-pointer">
                    Notify Me When We Launch
                  </button>
                  <button className="group flex items-center justify-center gap-2 rounded-full border border-border bg-surface-secondary px-6 py-2.5 text-sm font-semibold text-text-secondary transition-all hover:bg-surface-tertiary hover:text-primary cursor-pointer">
                    Join the Waiting List
                  </button>
                <Link href="/trading">
                    <button className="group flex items-center justify-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-6 py-2.5 text-sm font-semibold text-amber-400 transition-all hover:bg-amber-500/10 cursor-pointer">
                      Explore TRADINGO India
                    </button>
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-text-secondary max-w-md mx-auto border-t border-border pt-4">
                  <span>Coming Soon to Your Country.</span>
                  <span className="h-3 w-px bg-surface-tertiary" />
                  <span className="text-amber-400/80">Trade Without Borders.</span>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, Bell, Mail, Store, ChevronRight } from 'lucide-react';

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
  { code: 'AE', name: 'UAE' },
];

export default function TradingAcrossBorders() {
  const [selected, setSelected] = useState('India');
  const [showModal, setShowModal] = useState(false);

  const handleClick = (name: string) => {
    setSelected(name);
    if (name !== 'India') setShowModal(true);
  };

  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full bg-[rgba(212,175,55,0.04)] blur-[120px]" />
        <div className="absolute -right-40 bottom-1/4 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.03)] blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl text-center"
        >
          <div className="relative overflow-hidden rounded-[32px] border border-[rgba(212,175,55,0.1)] bg-[rgba(255,255,255,0.015)] p-10 sm:p-14"
            style={{
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 60px rgba(212,175,55,0.04), 0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[rgba(212,175,55,0.04)] blur-[60px]" />
              <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-[rgba(212,175,55,0.03)] blur-[60px]" />
            </div>

            <img
              src="/logo/trdn.png"
              alt="TRDN"
              className="mx-auto h-12 w-auto opacity-60 sm:h-14"
            />

            <div className="relative z-10 mt-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                Trading Across Borders
              </span>

              <h2 className="mt-5 whitespace-nowrap text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
                The Future of{' '}
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3] bg-clip-text text-transparent">
                  Global Trade
                </span>{' '}
                Starts Here
              </h2>

              <div className="mt-3 flex items-center justify-center gap-4">
                <span className="h-px w-6 bg-[rgba(212,175,55,0.3)]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#D4AF37]/60">
                  Connecting Businesses Beyond Boundaries
                </p>
                <span className="h-px w-8 bg-[rgba(212,175,55,0.3)]" />
              </div>

              <div className="mx-auto mt-8 max-w-3xl space-y-4">
                <p className="text-base leading-relaxed text-white/50 sm:text-lg">
                  TRADINGO is evolving from a powerful Indian B2B marketplace into a{' '}
                  <span className="font-medium text-white/70">Global Smart Trade System</span>{' '}
                  powered by TRADHEXA. Our mission is to connect buyers, sellers, manufacturers,
                  distributors and service providers across borders through trust, technology and
                  transparency.
                </p>

                <div className="flex items-center gap-4">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  <span className="text-[8px] text-white/20">●</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                </div>

                <p className="text-base leading-relaxed text-white/40 sm:text-lg">
                  We have started our journey in India and are progressively expanding our ecosystem
                  to South Asia, Southeast Asia, the Middle East and global markets.
                </p>
              </div>

              <div className="relative mt-10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="h-px w-48 bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.15)] to-transparent" />
                </div>
                <div className="relative flex items-center justify-center gap-6 rounded-2xl border border-[rgba(212,175,55,0.06)] bg-[rgba(255,255,255,0.01)] px-8 py-4">
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Born in</p>
                    <p className="text-lg font-black text-white">India</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Built for</p>
                    <p className="text-lg font-black text-[#D4AF37]">the World</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Powered by</p>
                    <p className="text-lg font-black text-white/60">TRADHEXA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12"
        >
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-black text-white sm:text-3xl">Select Your Region</h3>
            <p className="mt-2 text-sm text-white/40">
              Choose your country to explore TRADINGO&apos;s global expansion roadmap.
            </p>
          </div>

          <div className="mx-auto max-w-7xl rounded-[32px] border border-[rgba(212,175,55,0.12)] p-4 sm:p-6"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(25px)',
            }}
          >
            <div className="flex items-center justify-start gap-x-3 gap-y-0 overflow-x-auto flex-nowrap scrollbar-hide sm:justify-center sm:gap-x-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {countries.map((country, i) => {
                const isSelected = selected === country.name;
                return (
                  <motion.button
                    key={country.name}
                    onClick={() => handleClick(country.name)}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.04 }}
                    whileHover={{ scale: 1.08, y: -4 }}
                    className="group flex cursor-pointer flex-col items-center gap-2.5 bg-transparent p-0"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="relative flex h-[44px] w-[44px] items-center justify-center sm:h-[56px] sm:w-[56px]">
                    <div className={`absolute inset-0 rounded-full ${
                      isSelected
                        ? 'border-[3px] border-[#D4AF37]'
                        : 'border-2 border-white/25'
                    }`}
                    style={
                      isSelected
                        ? { boxShadow: '0 0 24px rgba(212,175,55,0.55)' }
                        : { boxShadow: '0 8px 20px rgba(0,0,0,0.35)' }
                    }>
                      <img
                        src={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png`}
                        alt={country.name}
                        className="h-full w-full rounded-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {isSelected && (
                      <motion.span
                        layoutId="gold-ring"
                        className="absolute inset-0 rounded-full border-[3px] border-[#D4AF37] pointer-events-none"
                        style={{ boxShadow: '0 0 24px rgba(212,175,55,0.55)' }}
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.15] to-transparent" />
                    {isSelected && (
                      <motion.span
                        layoutId="active-dot"
                        className="absolute -bottom-1.5 h-1.5 w-1.5 rounded-full bg-[#D4AF37]"
                        style={{ boxShadow: '0 0 8px rgba(212,175,55,0.6)' }}
                      />
                    )}
                  </div>
                    <span className={`text-[9px] sm:text-[10px] font-semibold transition-all duration-300 whitespace-nowrap ${
                      isSelected ? 'text-[#D4AF37]' : 'text-white/50 group-hover:text-white/80'
                    }`}>
                      {country.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {selected === 'India' && (
            <motion.div
              key="india-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="mt-8 overflow-hidden rounded-2xl border border-[rgba(212,175,55,0.1)] bg-gradient-to-br from-[rgba(212,175,55,0.04)] to-transparent p-8 text-center"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-[rgba(212,175,55,0.3)] shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
                <img
                  src="https://flagcdn.com/w80/in.png"
                  alt="India"
                  className="h-full w-full rounded-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.15] to-transparent" />
              </div>
              <h3 className="mt-4 text-2xl font-black text-white">Welcome to TRADINGO India</h3>
              <p className="mt-2 text-sm text-white/40">India is our home and our launch market.</p>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/55">
                Connect with verified buyers and sellers, explore RFQs, earn GOCASH rewards,
                participate in TRADGO and experience secure, transparent and intelligent trading.
              </p>
              <Link href="/browse">
                <motion.span
                  whileHover={{ y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0B1220] shadow-lg"
                >
                  Explore India Marketplace <ChevronRight size={16} />
                </motion.span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(212,175,55,0.15)] p-0 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                backdropFilter: 'blur(30px)',
              }}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-[rgba(212,175,55,0.06)] blur-[80px]" />
                <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-[rgba(212,175,55,0.04)] blur-[80px]" />
                <div className="absolute inset-0 opacity-[0.015]"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                  }} />
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-white/40 transition-all hover:bg-white/[0.1] hover:text-white"
              >
                <X size={14} />
              </button>

              <div className="relative z-10 p-8 text-center">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(212,175,55,0.08)]"
                  style={{ border: '1px solid rgba(212,175,55,0.15)' }}
                >
                  <Globe className="h-10 w-10 text-[#D4AF37]" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h3 className="mt-5 text-xl font-black text-white sm:text-2xl">Welcome to the TRADINGO Family</h3>
                  <p className="mt-1 text-xs font-semibold text-[#D4AF37]/70">Global Expansion in Progress</p>

                  <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/50">
                    Thank you for your interest in TRADINGO.
                  </p>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/40">
                    TRADINGO \u2013 The Global Smart TRADHEXA B2B Marketplace is currently launched in India and is progressively expanding into international markets.
                  </p>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/40">
                    We are actively preparing localized experiences for your region and look forward to welcoming you very soon.
                  </p>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/40">
                    We sincerely appreciate your patience and support.
                  </p>
                </motion.div>

                <div className="mt-6 flex flex-col gap-2.5">
                  <button className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C9A84C] px-6 py-2.5 text-sm font-bold text-[#0B1220] transition-all hover:shadow-lg hover:shadow-[rgba(212,175,55,0.25)]">
                    <Bell size={14} /> Notify Me When We Launch
                  </button>
                  <button className="group flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-6 py-2.5 text-sm font-semibold text-white/60 transition-all hover:bg-white/[0.08] hover:text-white">
                    <Mail size={14} /> Join the Waiting List
                  </button>
                  <Link href="/browse">
                    <button className="group flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.06)] px-6 py-2.5 text-sm font-semibold text-[#D4AF37] transition-all hover:bg-[rgba(212,175,55,0.1)]">
                      <Store size={14} /> Explore TRADINGO India
                    </button>
                  </Link>
                </div>

                <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-white/20">
                  <span>Coming Soon to Your Country.</span>
                  <span className="h-3 w-px bg-white/[0.06]" />
                  <span className="text-[#D4AF37]/40">Trade Without Borders.</span>
                  <span className="h-3 w-px bg-white/[0.06]" />
                  <span>Powered by TRADHEXA.</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

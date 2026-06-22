'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, ChevronRight, Bell, Mail, Store } from 'lucide-react';

const countries = [
  { flag: '\uD83C\uDDEE\uD83C\uDDF3', name: 'India', selected: true },
  { flag: '\uD83C\uDDE7\uD83C\uDDE9', name: 'Bangladesh' },
  { flag: '\uD83C\uDDF1\uD83C\uDDF0', name: 'Sri Lanka' },
  { flag: '\uD83C\uDDF3\uD83C\uDDF5', name: 'Nepal' },
  { flag: '\uD83C\uDDE7\uD83C\uDDF9', name: 'Bhutan' },
  { flag: '\uD83C\uDDE6\uD83C\uDDEB', name: 'Afghanistan' },
  { flag: '\uD83C\uDDEE\uD83C\uDDE9', name: 'Indonesia' },
  { flag: '\uD83C\uDDF2\uD83C\uDDFE', name: 'Malaysia' },
  { flag: '\uD83C\uDDF8\uD83C\uDDEC', name: 'Singapore' },
  { flag: '\uD83C\uDDEF\uD83C\uDDF5', name: 'Japan' },
  { flag: '\uD83C\uDDE8\uD83C\uDDF3', name: 'China' },
  { flag: '\uD83C\uDDF7\uD83C\uDDFA', name: 'Russia' },
  { flag: '\uD83C\uDDE6\uD83C\uDDEA', name: 'UAE' },
];

export default function SelectRegion() {
  const [selected, setSelected] = useState('India');
  const [showModal, setShowModal] = useState(false);

  const handleClick = (name: string) => {
    setSelected(name);
    if (name !== 'India') setShowModal(true);
  };

  return (
    <section className="relative overflow-hidden bg-[#0B1220] py-20">
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/3 h-[400px] w-[400px] rounded-full bg-[rgba(212,175,55,0.04)] blur-[120px]" />
        <div className="absolute -right-40 bottom-1/3 h-[300px] w-[300px] rounded-full bg-[rgba(212,175,55,0.03)] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h2
            className="inline-flex items-center justify-center whitespace-nowrap"
            style={{ gap: '18px', lineHeight: 1 }}
          >
            <span
              className="inline-block"
              style={{
                fontSize: '38px',
                filter: 'drop-shadow(0 0 20px rgba(82,177,255,0.25))',
                animation: 'float 4s ease-in-out infinite',
              }}
            >
              🌍
            </span>
            <span className="text-[48px] font-black leading-none text-white sm:text-[72px] lg:text-[96px]">
              Select{' '}
              <span className="bg-gradient-to-r from-[#FFD54A] to-[#D4AF37] bg-clip-text text-transparent">
                Region
              </span>
            </span>
          </h2>
          <p className="mt-2 text-sm text-white/40">
            Born in India <span className="mx-2 text-white/20">•</span> Built for Global Trade{' '}
            <span className="mx-2 text-white/20">•</span> Powered by{' '}
            <span className="font-semibold text-[#D4AF37]/70">TRADHEXA</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto max-w-5xl rounded-[32px] border border-[rgba(212,175,55,0.18)] p-6 sm:p-8"
          style={{
            background: 'rgba(11,18,32,0.55)',
            backdropFilter: 'blur(25px)',
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-6 sm:gap-x-8 lg:gap-x-6">
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
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full sm:h-[64px] sm:w-[64px]">
                    {isSelected && (
                      <motion.span
                        layoutId="gold-ring"
                        className="absolute inset-0 rounded-full border-2 border-[#D4AF37]"
                        style={{ boxShadow: '0 0 20px rgba(212,175,55,0.3)' }}
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                    <span
                      className={`relative text-3xl transition-transform duration-300 sm:text-4xl ${
                        isSelected ? 'scale-110' : 'group-hover:scale-110'
                      }`}
                    >
                      {country.flag}
                    </span>
                    {isSelected && (
                      <motion.span
                        layoutId="active-dot"
                        className="absolute -bottom-1.5 h-1.5 w-1.5 rounded-full bg-[#D4AF37]"
                        style={{ boxShadow: '0 0 8px rgba(212,175,55,0.6)' }}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-semibold transition-all duration-300 ${
                      isSelected ? 'text-[#D4AF37]' : 'text-white/50 group-hover:text-white/80'
                    }`}
                  >
                    {country.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.65)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(212,175,55,0.15)] p-0 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(11,18,32,0.95), rgba(11,18,32,0.98))',
                backdropFilter: 'blur(30px)',
              }}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-[rgba(212,175,55,0.06)] blur-[80px]" />
                <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-[rgba(212,175,55,0.04)] blur-[80px]" />
                <div
                  className="absolute inset-0 opacity-[0.015]"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                  }}
                />
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
                  <h3 className="mt-5 text-xl font-black text-white sm:text-2xl">
                    Welcome to the TRADINGO Family
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#D4AF37]/70">
                    Global Expansion in Progress
                  </p>

                  <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/50">
                    Thank you for your interest in TRADINGO.
                  </p>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/40">
                    TRADINGO – The Global Smart TRADHEXA B2B Marketplace is currently launched in
                    India and is progressively expanding into international markets.
                  </p>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/40">
                    We are actively preparing localized experiences for your region and look forward
                    to welcoming you very soon.
                  </p>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/40">
                    We sincerely appreciate your patience and support.
                  </p>
                </motion.div>

                <div className="mt-6 flex flex-col gap-2.5">
                  <button className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C9A84C] px-6 py-2.5 text-sm font-bold text-[#0B1220] transition-all hover:shadow-lg hover:shadow-[rgba(212,175,55,0.25)]">
                    <Bell size={14} /> Notify Me
                  </button>
                  <button className="group flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-6 py-2.5 text-sm font-semibold text-white/60 transition-all hover:bg-white/[0.08] hover:text-white">
                    <Mail size={14} /> Join Waitlist
                  </button>
                  <Link href="/browse">
                    <button className="group flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.06)] px-6 py-2.5 text-sm font-semibold text-[#D4AF37] transition-all hover:bg-[rgba(212,175,55,0.1)]">
                      <Store size={14} /> Explore India Marketplace
                    </button>
                  </Link>
                </div>

                <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-white/20">
                  <span className="flex items-center gap-1">🌍 Expanding Globally</span>
                  <span className="h-3 w-px bg-white/[0.06]" />
                  <span className="flex items-center gap-1">🚀 Launching Soon</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

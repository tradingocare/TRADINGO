'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, Bell, Mail, Store } from 'lucide-react';
import { MASTER_COUNTRIES } from '@/data/master-data';

const countries = MASTER_COUNTRIES.map(c => ({ flag: c.flag, name: c.name, selected: c.code === 'IN' }));

export default function SelectRegion() {
  const [selected, setSelected] = useState('India');
  const [showModal, setShowModal] = useState(false);

  const handleClick = (name: string) => {
    setSelected(name);
    if (name !== 'India') setShowModal(true);
  };

  return (
    <section className="relative overflow-hidden bg-[var(--bg-base)] py-20">
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/3 h-[400px] w-[400px] rounded-full bg-[rgba(0,255,255,0.04)] blur-[120px]" />
        <div className="absolute -right-40 bottom-1/3 h-[300px] w-[300px] rounded-full bg-[rgba(0,255,255,0.03)] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
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
            <span className="text-[48px] font-black leading-none text-primary sm:text-[72px] lg:text-[96px]">
              Select{' '}
              <span className="bg-gradient-to-r from-accent-500 to-[#00CCCC] bg-clip-text text-transparent">
                Region
              </span>
            </span>
          </h2>
          <p className="mt-2 text-sm text-text-tertiary">
            Born in India <span className="mx-2 text-text-secondary">|</span> Built for Global Trade{' '}
            <span className="mx-2 text-text-secondary">|</span> Powered by{' '}
            <span className="font-semibold text-accent-500">TRADHEXA</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto max-w-5xl rounded-[32px] border border-[rgba(0,255,255,0.18)] p-6 sm:p-8 glow-card"
          style={{
            background: 'var(--bg-elevated)',
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
                        className="absolute inset-0 rounded-full border-2 border-accent-500"
                        style={{ boxShadow: '0 0 20px rgba(0,255,255,0.3)' }}
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
                        className="absolute -bottom-1.5 h-1.5 w-1.5 rounded-full bg-accent-500"
                        style={{ boxShadow: '0 0 8px rgba(0,255,255,0.6)' }}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-semibold transition-all duration-300 ${
                      isSelected ? 'text-accent-500' : 'text-gray-400 group-hover:text-primary'
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
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(0,255,255,0.15)] p-0 shadow-2xl"
              style={{
                background: 'var(--bg-elevated)',
                backdropFilter: 'blur(30px)',
              }}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-[rgba(0,255,255,0.06)] blur-[80px]" />
                <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-[rgba(0,255,255,0.04)] blur-[80px]" />
                <div
                  className="absolute inset-0 opacity-[0.015]"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(0,255,255,0.4) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                  }}
                />
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-primary/60 transition-all hover:bg-black/90 hover:text-primary"
              >
                <X size={14} />
              </button>

              <div className="relative z-10 p-8 text-center">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(0,255,255,0.08)]"
                  style={{ border: '1px solid rgba(0,255,255,0.15)' }}
                >
                  <Globe className="h-10 w-10 text-accent-500" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h3 className="mt-5 text-xl font-black text-primary sm:text-2xl">
                    Welcome to the TRADINGO Family
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-accent-500">
                    Global Expansion in Progress
                  </p>

                  <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-primary/50">
                    Thank you for your interest in TRADINGO.
                  </p>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-primary/40">
                    TRADINGO &mdash; The Global Smart TRADHEXA B2B Marketplace is currently launched in
                    India and is progressively expanding into international markets.
                  </p>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-primary/40">
                    We are actively preparing localized experiences for your region and look forward
                    to welcoming you very soon.
                  </p>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-primary/40">
                    We sincerely appreciate your patience and support.
                  </p>
                </motion.div>

                <div className="mt-6 flex flex-col gap-2.5">
                  <button className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent-dark)] to-[var(--accent)] px-6 py-2.5 text-sm font-bold text-primary transition-all hover:shadow-lg hover:shadow-[rgba(0,255,255,0.25)]">
                    <Bell size={14} /> Notify Me
                  </button>
                  <button className="btn-glass group flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all hover:scale-102">
                    <Mail size={14} /> Join Waitlist
                  </button>
                  <Link href="/products">
                    <button className="group flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(0,255,255,0.15)] bg-[rgba(0,255,255,0.06)] px-6 py-2.5 text-sm font-semibold text-accent-500 transition-all hover:bg-[rgba(0,255,255,0.1)]">
                      <Store size={14} /> Explore India Marketplace
                    </button>
                  </Link>
                </div>

                <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-primary/20">
                  <span className="flex items-center gap-1">🌐 Expanding Globally</span>
                  <span className="h-3 w-px bg-surface-tertiary" />
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






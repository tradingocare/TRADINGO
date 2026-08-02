'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, ChevronLeft, ChevronRight,
  ArrowRight, Play, Pause,
  Star, BadgeCheck, TrendingUp,
} from 'lucide-react';
import { HERO_VENDOR_SLIDES } from '@/data/master-data';

const VENDOR_SLIDES = HERO_VENDOR_SLIDES;


const BADGE_MAP = {
  ELITE: { bg: 'rgba(201,168,76,0.15)', border: 'rgba(201,168,76,0.5)', text: '#F2C94C' },
  PREMIUM: { bg: 'rgba(155,93,229,0.15)', border: 'rgba(155,93,229,0.5)', text: '#9B5DE5' },
  VERIFIED: { bg: 'rgba(45,224,224,0.12)', border: 'rgba(45,224,224,0.4)', text: '#2DE0E0' },
  ENTERPRISE: { bg: 'rgba(61,139,255,0.15)', border: 'rgba(61,139,255,0.5)', text: '#3D8BFF' },
};

export default function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SLIDE_DURATION = 5000;

  useEffect(() => {
    if (!playing) return;
    const tick = 50;
    let elapsed = progress * SLIDE_DURATION;

    intervalRef.current = setInterval(() => {
      elapsed += tick;
      setProgress(elapsed / SLIDE_DURATION);
      if (elapsed >= SLIDE_DURATION) {
        elapsed = 0;
        setProgress(0);
        setActiveSlide(i => (i + 1) % VENDOR_SLIDES.length);
      }
    }, tick);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, activeSlide]);

  const goTo = (i: number) => {
    setActiveSlide(i);
    setProgress(0);
  };
  const prev = () => goTo((activeSlide - 1 + VENDOR_SLIDES.length) % VENDOR_SLIDES.length);
  const next = () => goTo((activeSlide + 1) % VENDOR_SLIDES.length);

  const slide = VENDOR_SLIDES[activeSlide];
  const badge = BADGE_MAP[slide.badge];

  return (
    <section className="relative min-h-screen overflow-hidden"
      style={{ background: 'var(--bg-base)' }}>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { color: '#3b82f6', x: '-10%', y: '-15%', size: '55vw' },
          { color: '#8b5cf6', x: '80%', y: '-10%', size: '45vw' },
          { color: '#22c55e', x: '40%', y: '70%', size: '50vw' },
          { color: '#f97316', x: '-5%', y: '60%', size: '35vw' },
          { color: '#facc15', x: '30%', y: '10%', size: '40vw' },
        ].map((b, i) => (
          <motion.div key={i}
            className="absolute rounded-full"
            style={{
              left: b.x, top: b.y,
              width: b.size, height: b.size,
              background: `radial-gradient(circle, ${b.color}15, transparent 70%)`,
              filter: 'blur(100px)',
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 8 + i * 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-10
                      grid lg:grid-cols-2 gap-8 xl:gap-12 min-h-screen
                      items-start pt-12 pb-16">

        <div className="flex flex-col gap-6">

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-0"
          >
            <Image
              src="/logo/trdn.png"
              alt="TRADINGO"
              width={400} height={400}
              style={{ width: '300px', height: '300px' }}
              className="object-contain"
              priority
            />
            <div className="flex gap-1.5" style={{ marginTop: '-10mm' }}>
              <span className="text-lg font-semibold text-primary/50">Trading Right.</span>
              <span className="text-lg font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #00E5FF 50%, #00CCFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Go Bright.</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-primary whitespace-nowrap">
              India&apos;s Next-Generation B2B Wholesale Marketplace
            </h1>

            <p className="text-xl sm:text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #00E5FF 50%, #00CCFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              Buy Better. Sell Faster. Grow Bigger with TRADINGO.
            </p>

            <p className="text-text-secondary text-sm sm:text-base leading-snug line-clamp-3">
              Discover verified manufacturers, suppliers, and distributors across India. Compare
              wholesale prices, connect directly with sellers, request quotations, negotiate deals,
              and place bulk orders&mdash;all on one trusted platform built for modern businesses.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/products">
                <motion.span
                  whileHover={{ y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 font-bold rounded-full
                             px-6 py-3 text-sm cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #6366f6)',
                    color: '#fff',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
                  }}>
                  Start Buying <ArrowRight size={15} />
                </motion.span>
              </Link>
              <Link href="/register">
                <motion.span
                  whileHover={{ y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 font-bold rounded-full
                             bg-surface-secondary border border-border text-text-secondary
                             px-6 py-3 text-sm cursor-pointer">
                  Become a Seller <ArrowRight size={15} />
                </motion.span>
              </Link>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-3 whitespace-nowrap overflow-x-auto pb-1">
              {[
                { icon: '\uD83D\uDD0D', label: 'TRADFIND' },
                { icon: '\uD83C\uDFAF', label: 'TRADMATCH' },
                { icon: '\uD83D\uDCE9', label: 'TRADRFQ' },
                { icon: '\uD83E\uDD1D', label: 'TRADCONNECT' },
                { icon: '\uD83D\uDEE1\uFE0F', label: 'TRADTRUST' },
                { icon: '\u267E\uFE0F', label: 'TRADZERO' },
              ].map((item) => (
                <span key={item.label}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                             text-[9px] sm:text-[10px] font-semibold tracking-wide
                             bg-surface-secondary border border-border
                             text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary
                             hover:border-accent/30 transition-all duration-300 min-w-[64px]"
                >
                  <span className="text-base sm:text-lg leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-xl sm:text-2xl tracking-widest text-primary">
                GO DIGITAL
              </p>
              <p className="text-primary/35 text-[10px] uppercase tracking-[0.2em] mt-0.5">
                Premium Vendor Showcase &middot; Advertising Space
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500"
              />
              <span className="text-[10px] text-primary/40 font-medium">LIVE</span>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-[28px] p-[3px]"
              style={{
                background: 'linear-gradient(135deg, #C9A84C, #8B6914, #F2C94C, #8B6914, #C9A84C)',
                boxShadow: `
                  0 0 0 1px rgba(201,168,76,0.3),
                  0 0 60px rgba(201,168,76,0.15),
                  0 32px 80px rgba(0,0,0,0.7),
                  inset 0 1px 0 rgba(255,255,255,0.15)
                `,
              }}>
              <div className="rounded-[26px] p-[2px]"
                style={{ background: 'linear-gradient(180deg, #111, #000)' }}>
                <div className="relative rounded-[24px] overflow-hidden"
                  style={{ background: '#000', aspectRatio: '16/10' }}>

                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="absolute top-0 left-0 right-0 h-24 opacity-30"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.12), transparent)',
                      }} />
                    <div className="absolute top-4 left-4 w-12 h-20 opacity-20 rotate-12"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                        filter: 'blur(8px)',
                      }} />
                  </div>

                  <motion.div
                    className="absolute inset-0 pointer-events-none z-10 rounded-[24px]"
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ boxShadow: `inset 0 0 40px ${slide.accentColor}25` }} />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlide}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.55, ease: 'easeInOut' }}
                      className="absolute inset-0"
                      style={{ background: slide.banner }}
                    >
                      <div className="absolute inset-0 opacity-[0.04]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }} />

                      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
                        <motion.div
                          initial={{ opacity: 0, y: -12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="flex items-center justify-between"
                        >
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase
                                           tracking-widest px-2.5 py-1 rounded-full"
                            style={{
                              background: badge.bg,
                              border: `1px solid ${badge.border}`,
                              color: badge.text,
                            }}>
                            {slide.badge}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-primary/40 font-medium">
                            {slide.category}
                          </span>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <h2 className="font-black text-primary leading-tight"
                              style={{ fontSize: 'clamp(14px, 2.2vw, 20px)' }}>
                              {slide.vendorName}
                            </h2>
                            <BadgeCheck size={14} className="text-blue-400 flex-shrink-0" />
                          </div>

                          <p className="text-primary/60 text-[10px] sm:text-xs leading-snug">
                            {slide.tagline}
                          </p>

                          <div className="flex gap-3 pt-1">
                            {slide.stats.map(st => (
                              <div key={st.label}
                                className="flex flex-col items-center px-2.5 py-1.5 rounded-xl bg-surface-secondary border border-border">
                                <span className="font-black text-primary text-xs sm:text-sm">
                                  {st.value}
                                </span>
                                <span className="text-primary/40 text-[8px] sm:text-[9px]">
                                  {st.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="space-y-2"
                        >
                          {slide.offer && (
                            <div className="text-[9px] sm:text-[10px] font-semibold px-3 py-1.5
                                            rounded-xl inline-block bg-surface-secondary border border-border text-text-primary">
                              {slide.offer}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <Link href={slide.ctaHref}>
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-1.5 font-bold
                                           text-[10px] sm:text-xs px-3 py-1.5 rounded-full
                                           cursor-pointer"
                                style={{
                                  background: `linear-gradient(135deg, ${slide.accentColor}, ${slide.accentColor}CC)`,
                                  color: '#fff',
                                  boxShadow: `0 4px 16px ${slide.accentColor}40`,
                                }}>
                                {slide.cta} <ArrowRight size={11} />
                              </motion.span>
                            </Link>

                            <div className="flex items-center gap-1">
                              <Star size={10} className="text-yellow-400 fill-yellow-400" />
                              <Star size={10} className="text-yellow-400 fill-yellow-400" />
                              <Star size={10} className="text-yellow-400 fill-yellow-400" />
                              <Star size={10} className="text-yellow-400 fill-yellow-400" />
                              <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-2">
                {VENDOR_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="relative rounded-full overflow-hidden transition-all duration-300"
                    style={{
                      width: i === activeSlide ? '28px' : '6px',
                      height: '6px',
                      background: i === activeSlide ? 'rgba(255,77,0,0.3)' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {i === activeSlide && (
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-accent-500"
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setPlaying(p => !p)}
                  className="w-7 h-7 rounded-full flex items-center justify-center
                             bg-surface-secondary
                             text-primary/50 hover:text-primary transition-colors">
                  {playing ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button onClick={prev}
                  className="w-7 h-7 rounded-full flex items-center justify-center
                             bg-surface-secondary
                             text-primary/50 hover:text-primary transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={next}
                  className="w-7 h-7 rounded-full flex items-center justify-center
                             bg-surface-secondary
                             text-primary/50 hover:text-primary transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="mt-3 px-1 flex items-center justify-between">
              <p className="text-[9px] text-primary/25 uppercase tracking-widest">
                Featured Advertiser \u00B7 Slide {activeSlide + 1} of {VENDOR_SLIDES.length}
              </p>
              <Link href="/seller-plans"
                className="text-[9px] font-semibold uppercase tracking-widest text-accent-blue
                           hover:underline transition-colors">
                Advertise Here \u2192
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {[
              { icon: Shield, label: '5-Layer KYC', sub: 'TRADTRUST Verified' },
              { icon: Lock, label: 'Escrow Protected', sub: 'TRADZERO Guaranteed' },
              { icon: TrendingUp, label: 'AI-Matched RFQs', sub: 'TRADMATCH Engine' },
            ].map((t, i) => {
              const Icon = t.icon;
              return (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + i * 0.1 }}
                  className="flex flex-col items-center text-center gap-0.5 p-2 rounded-xl bg-surface-secondary border border-border">
                  <Icon size={12} className="text-accent-blue" />
                  <p className="text-primary text-[8px] sm:text-[10px] font-semibold">{t.label}</p>
                  <p className="text-primary/35 text-[7px] sm:text-[8px]">{t.sub}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

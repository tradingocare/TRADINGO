'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  const reduceMotion = useReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SLIDE_DURATION = 5000;

  useEffect(() => {
    if (reduceMotion) setPlaying(false);
  }, [reduceMotion]);

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
                      items-center pt-12 pb-16">

        <div className="flex flex-col gap-6">

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-0"
          >
            <Image
              src="/logo/trdn5.png"
              alt="TRADINGO"
              width={400} height={400}
              className="w-[min(300px,70vw)] object-contain"
              priority
            />
            <div className="mt-4 flex gap-1.5">
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
            <h1 className="text-[22px] sm:text-2xl font-black leading-tight text-primary">
              The Global Marketplace for Businesses &amp; Consumers
            </h1>

            <p className="text-xl sm:text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #00E5FF 50%, #00CCFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              Buy Better. Sell Faster. Grow Bigger with TRADINGO.
            </p>

            <p className="text-text-secondary text-sm sm:text-base leading-snug">
              Discover verified manufacturers, suppliers, distributors, and service providers worldwide. Explore products, raw materials, daily essentials, machinery, business supplies, and professional services. Compare prices, connect directly, request quotations, negotiate deals, and find the right solutions&mdash;all on one trusted global marketplace.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/trading">
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
                             text-[10px] sm:text-[11px] font-semibold tracking-wide
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
          className="relative flex flex-col gap-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-black text-xl sm:text-2xl tracking-wider text-primary whitespace-nowrap">
                GO DIGITAL
              </span>
              <span className="h-4 w-px bg-surface-tertiary hidden sm:inline-block opacity-60" />
              <span className="text-text-secondary text-xs sm:text-sm uppercase tracking-wider font-semibold whitespace-nowrap">
                Premium Vendor Showcase &middot; Advertising Space
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/30 bg-red-500/10">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500"
              />
              <span className="text-[11px] text-red-400 font-semibold tracking-wide">LIVE</span>
            </div>
          </div>

          <div className="relative" aria-roledescription="carousel" aria-label="GO DIGITAL premium vendor spotlight">
            {/* TV ambient backlight glow */}
            <div className="absolute -inset-3 rounded-[36px] opacity-60 blur-2xl"
              style={{
                background: `radial-gradient(ellipse at center, ${slide.accentColor}20, transparent 70%)`,
              }} />

            {/* TV outer bezel — premium metallic frame */}
            <div className="relative rounded-[32px] p-[4px]"
              style={{
                background: 'linear-gradient(160deg, #3d3d3d 0%, #232323 16%, #101010 42%, #060606 68%, #1a1a1a 100%)',
                boxShadow: `
                  0 0 0 1px rgba(255,255,255,0.07),
                  0 0 90px rgba(201,168,76,0.10),
                  0 45px 110px rgba(0,0,0,0.85),
                  inset 0 1px 0 rgba(255,255,255,0.14),
                  inset 0 -1px 0 rgba(0,0,0,0.7),
                  inset 1px 0 0 rgba(255,255,255,0.05),
                  inset -1px 0 0 rgba(255,255,255,0.05)
                `,
              }}>

              {/* Inner bezel ring — screen lip */}
              <div className="rounded-[28px] p-[3px]"
                style={{ background: 'linear-gradient(180deg, #202020, #050505 45%, #000 100%)' }}>

                {/* Screen surface */}
                <div className="relative rounded-[26px] overflow-hidden"
                  style={{ background: '#000', aspectRatio: '16/10' }}>

                  {/* Screen reflections */}
                  <div className="absolute inset-0 pointer-events-none z-20" aria-hidden>
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

                  {/* Screen edge glow */}
                  {reduceMotion ? (
                    <div className="absolute inset-0 pointer-events-none z-10 rounded-[26px]"
                      style={{ boxShadow: `inset 0 0 40px ${slide.accentColor}25` }} />
                  ) : (
                    <motion.div
                      className="absolute inset-0 pointer-events-none z-10 rounded-[26px]"
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ boxShadow: `inset 0 0 40px ${slide.accentColor}25` }} />
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlide}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
                      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.55, ease: 'easeInOut' }}
                      className="absolute inset-0"
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`Slide ${activeSlide + 1} of ${VENDOR_SLIDES.length} — ${slide.vendorName}`}
                      style={{ background: slide.banner }}
                    >
                      <div className="absolute inset-0 opacity-[0.04]" aria-hidden
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }} />

                      {/* Cinematic lighting — bottom-heavy for readability */}
                      <div className="absolute inset-0" aria-hidden
                        style={{
                          background: 'linear-gradient(180deg, rgba(2,6,23,0.35) 0%, rgba(2,6,23,0.06) 34%, rgba(2,6,23,0.55) 72%, rgba(2,6,23,0.86) 100%)',
                        }} />
                      <div className="absolute inset-0" aria-hidden
                        style={{
                          background: 'radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,0.5) 100%)',
                        }} />

                      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
                        {/* TOP — broadcast label */}
                        <motion.div
                          initial={{ opacity: 0, y: -12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={reduceMotion ? { duration: 0 } : { delay: 0.15 }}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="inline-flex items-center text-[10px] sm:text-[11px] font-black uppercase
                                           tracking-[0.22em] px-2.5 py-1 rounded-sm text-white"
                            style={{
                              background: 'rgba(0,0,0,0.45)',
                              borderLeft: `3px solid ${badge.text}`,
                              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                            }}>
                            {slide.badge}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                            {slide.category}
                          </span>
                        </motion.div>

                        {/* CENTER — vendor headline */}
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={reduceMotion ? { duration: 0 } : { delay: 0.2 }}
                          className="space-y-2 max-w-[92%]"
                        >
                          <div className="flex items-center gap-2">
                            <h2 className="font-black text-white leading-tight"
                              style={{ fontSize: 'clamp(15px, 2.2vw, 22px)', textShadow: '0 2px 14px rgba(0,0,0,0.65)' }}>
                              {slide.vendorName}
                            </h2>
                            <BadgeCheck size={15} className="text-blue-400 flex-shrink-0" aria-label="Verified vendor" />
                          </div>

                          <p className="text-white/75 text-[10px] sm:text-xs font-semibold leading-snug"
                            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.75)' }}>
                            {slide.tagline}
                          </p>
                        </motion.div>

                        {/* BOTTOM — data overlay + offer + CTA */}
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={reduceMotion ? { duration: 0 } : { delay: 0.3 }}
                          className="space-y-2.5"
                        >
                          {/* Supporting stats — premium data overlay, hairline divided */}
                          <div className="flex items-stretch divide-x divide-white/15 w-fit rounded-lg px-3 py-2"
                            style={{
                              background: 'linear-gradient(90deg, rgba(0,0,0,0.55), rgba(0,0,0,0.25))',
                              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                            }}>
                            {slide.stats.map((st) => (
                              <div key={st.label} className="flex flex-col justify-center px-3 first:pl-0 last:pr-0">
                                <span className="font-black text-white text-xs sm:text-sm leading-none"
                                  style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}>
                                  {st.value}
                                </span>
                                <span className="text-white/55 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1">
                                  {st.label}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            {slide.offer && (
                              <div className="inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-white/85"
                                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}>
                                <span className="w-1 h-1 rounded-full" aria-hidden
                                  style={{ background: slide.accentColor, boxShadow: `0 0 8px ${slide.accentColor}` }} />
                                {slide.offer}
                              </div>
                            )}

                            <div className="flex items-center gap-2.5 ml-auto">
                              <div className="hidden sm:flex items-center gap-0.5" aria-hidden>
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={11} className="text-yellow-400 fill-yellow-400" />
                                ))}
                              </div>
                              <Link
                                href={slide.ctaHref}
                                className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                              >
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="inline-flex items-center gap-1.5 font-bold
                                             text-[10px] sm:text-xs px-4 py-1.5 rounded-full
                                             cursor-pointer"
                                  style={{
                                    background: `linear-gradient(135deg, ${slide.accentColor}, ${slide.accentColor}CC)`,
                                    color: '#fff',
                                    boxShadow: `0 4px 18px ${slide.accentColor}50`,
                                  }}>
                                  {slide.cta} <ArrowRight size={11} />
                                </motion.span>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Glass sheen — slow premium drift over the whole panel */}
                  {reduceMotion ? (
                    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-[26px]" aria-hidden>
                      <div className="absolute -inset-y-4 -left-1/3 w-1/4 rotate-[18deg] opacity-[0.05]"
                        style={{ background: 'linear-gradient(90deg, transparent, #ffffff, transparent)' }} />
                    </div>
                  ) : (
                    <motion.div
                      className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-[26px]"
                      style={{ opacity: 0 }}
                      aria-hidden
                    >
                      <motion.div
                        className="absolute -inset-y-4 left-1/3 w-1/4 rotate-[18deg]"
                        style={{ background: 'linear-gradient(90deg, transparent, #ffffff, transparent)' }}
                        animate={{ opacity: [0, 0.05, 0], left: ['-20%', '120%'] }}
                        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', repeatDelay: 6 }}
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>

            <div className="flex items-center justify-between mt-2.5 px-1">
              <div className="flex items-center gap-2.5">
                {VENDOR_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === activeSlide}
                    className="relative rounded-full overflow-hidden transition-all duration-300
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    style={{
                      width: i === activeSlide ? '32px' : '8px',
                      height: '8px',
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
                  aria-label={playing ? 'Pause slide rotation' : 'Play slide rotation'}
                  className="w-8 h-8 rounded-full flex items-center justify-center
                             border border-white/15 bg-black/20
                             text-white/70 hover:text-white hover:border-white/30 hover:bg-black/40
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors">
                  {playing ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <button onClick={prev}
                  aria-label="Previous slide"
                  className="w-8 h-8 rounded-full flex items-center justify-center
                             border border-white/15 bg-black/20
                             text-white/70 hover:text-white hover:border-white/30 hover:bg-black/40
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={next}
                  aria-label="Next slide"
                  className="w-8 h-8 rounded-full flex items-center justify-center
                             border border-white/15 bg-black/20
                             text-white/70 hover:text-white hover:border-white/30 hover:bg-black/40
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            <div className="mt-2 px-1 flex items-center justify-between">
              <p className="text-[11px] sm:text-xs text-text-secondary font-medium tracking-wide">
                Featured Advertiser &middot; Slide {activeSlide + 1} of {VENDOR_SLIDES.length}
              </p>
              <Link href="/seller-plans"
                className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-accent-blue
                           hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded transition-colors">
                Advertise Here &rarr;
              </Link>
            </div>

          <div className="grid grid-cols-3 divide-x divide-white/10 mt-2 rounded-xl overflow-hidden">
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
                  className="flex flex-col items-center text-center gap-0.5 py-2 px-2.5">
                  <Icon size={15} className="text-accent-blue" />
                  <p className="text-primary text-[11px] sm:text-xs font-bold">{t.label}</p>
                  <p className="text-text-secondary text-[9px] sm:text-[10px] font-medium">{t.sub}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

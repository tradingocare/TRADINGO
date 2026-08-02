/* ═══════════════════════════════════════════════════════════════
   RECOVERY: tailwind.config.ts
   Source: Session reconstruction (21 June 2026)
   Confidence: HIGH
   ═══════════════════════════════════════════════════════════════ */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#DBF1FD',
          elevated: '#FFFFFF',
          elevated2: '#F0F7FE',
        },
        primary: {
          DEFAULT: '#0F172A',        // text-primary
          light: '#334155',         // text-secondary
          lighter: '#64748B',       // text-tertiary
        },
        accent: {
          DEFAULT: '#FF4D00',       // --accent
          light: '#FF7A33',         // --accent-light
          dark: '#CC3D00',          // --accent-dark
          soft: 'rgba(255, 77, 0, 0.08)',   // --accent-08
          subtle: 'rgba(255, 77, 0, 0.15)',  // --accent-15
          hover: 'rgba(255, 77, 0, 0.25)',   // --accent-25
          blue: '#3D8BFF',
          amber: '#F59E0B',
          gold: '#D4AF37',
          green: '#4ade80',
          pink: '#F43F5E',
          purple: '#8B5CF6',
          yellow: '#FBBF24',
        },
        surface: {
          DEFAULT: '#FFFFFF',       // --card-bg
          hover: 'rgba(255, 255, 255, 0.98)',  // --card-bg-hover
          border: 'rgba(148, 163, 184, 0.15)',  // --card-border
          borderHover: 'rgba(255, 77, 0, 0.25)',  // --card-border-hover
          soft: 'rgba(255, 255, 255, 0.9)',      // --card-bg - back compatibility
        },
        shadow: {
          card: '0 4px 24px rgba(0, 0, 0, 0.04)',                    // --card-shadow
          cardHover: '0 8px 32px rgba(0, 0, 0, 0.07)',             // --card-shadow-hover
          soft: '0 8px 40px rgba(0, 0, 0, 0.30)',
        },
        border: {
          thin: 'rgba(148, 163, 184, 0.2)',
          light: 'rgba(148, 163, 184, 0.12)',
          theme: 'rgba(255, 77, 0, 0.08)',
        },
        text: {
          primary: '#0F172A',       // --text-primary
          secondary: '#334155',    // --text-secondary
          tertiary: '#64748B',     // --text-tertiary
          muted: '#94A3B8',         // --text-muted
          onAccent: '#FFFFFF',     // --text-on-accent
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.65)',
          bgHover: 'rgba(255, 255, 255, 0.82)',
          border: 'rgba(148, 163, 184, 0.15)',
          borderHover: 'rgba(255, 77, 0, 0.25)',
          shadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
          shadowHover: '0 8px 32px rgba(0, 0, 0, 0.07)',
        },
        glow: {
          blue: '#6366f1',
          cyan: '#06b6d4',
          purple: '#8b5cf6',
          pink: '#ec4899',
          orange: '#f97316',
          gold: '#f59e0b',
        },
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '60px',
      },
      boxShadow: {
        'glow-accent': '0 0 30px rgba(245, 158, 11, 0.25)',
        'glow-soft': '0 8px 40px rgba(0, 0, 0, 0.30)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.07)',
      },
      animation: {
        'nav-shine': 'navGlassShine 7s ease-in-out infinite',
        'light-sweep': 'lightSweep 8s ease-in-out infinite',
        'nav-active-pulse': 'navActivePulse 2.8s ease-in-out infinite',
        'nav-underline': 'navUnderlineShimmer 3s linear infinite',
        'nav-glass-shine': 'navGlassShine 8s ease-in-out infinite',
        'gradient': 'gradient 15s ease infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
      },
    },
  },
  plugins: [],
};
export default config;

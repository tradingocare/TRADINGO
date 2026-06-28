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
        base: {
          DEFAULT: '#1D0001',
          elevated: '#2A0822',
          elevated2: '#350D2C',
        },
        accent: {
          DEFAULT: '#FF4D00',
          light: '#FF7A3D',
          dark: '#CC3D00',
        },
        glow: {
          blue: '#3D8BFF',
          cyan: '#2DE0E0',
          purple: '#9B5DE5',
          pink: '#F15BB5',
          orange: '#FF7A3D',
          gold: '#F2C94C',
        },
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '60px',
      },
      boxShadow: {
        'glow-accent': '0 0 30px rgba(255, 77, 0, 0.25)',
        'glow-soft': '0 8px 40px rgba(0, 0, 0, 0.30)',
      },
    },
  },
  plugins: [],
};
export default config;

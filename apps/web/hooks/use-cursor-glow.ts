/* ═══════════════════════════════════════════════════════════════
   RECOVERY: hooks/use-cursor-glow.ts
   Source: Session reconstruction (21 June 2026)
   Confidence: HIGH
   ═══════════════════════════════════════════════════════════════ */

'use client';

import { useEffect, useRef } from 'react';

const GLOW_COLORS = [
  'rgba(61, 139, 255, 0.15)',
  'rgba(45, 224, 224, 0.15)',
  'rgba(155, 93, 229, 0.15)',
  'rgba(241, 91, 181, 0.15)',
  'rgba(255, 122, 61, 0.15)',
  'rgba(242, 201, 76, 0.15)',
];

export function useCursorGlow<T extends HTMLElement>(index = 0) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const glowColor = GLOW_COLORS[index % GLOW_COLORS.length];
    el.style.setProperty('--glow-color', glowColor);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', `${x}%`);
      el.style.setProperty('--my', `${y}%`);
    };

    const handleMouseLeave = () => {
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '50%');
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [index]);

  return ref;
}

'use client';

import { useEffect } from 'react';

// Maps base accent colors to RGB glow values
const ACCENT_COLORS: Record<string, { glow: string; shadow: string; border: string }> = {
  blue: {
    glow: 'rgba(59, 130, 246, 0.12)',
    shadow: 'rgba(59, 130, 246, 0.25)',
    border: 'rgba(59, 130, 246, 0.35)',
  },
  cyan: {
    glow: 'rgba(6, 255, 200, 0.10)',
    shadow: 'rgba(6, 255, 200, 0.22)',
    border: 'rgba(6, 255, 200, 0.30)',
  },
  emerald: {
    glow: 'rgba(34, 197, 94, 0.10)',
    shadow: 'rgba(34, 197, 94, 0.22)',
    border: 'rgba(34, 197, 94, 0.30)',
  },
  green: {
    glow: 'rgba(34, 197, 94, 0.10)',
    shadow: 'rgba(34, 197, 94, 0.22)',
    border: 'rgba(34, 197, 94, 0.30)',
  },
  orange: {
    glow: 'rgba(255, 77, 0, 0.12)',
    shadow: 'rgba(255, 77, 0, 0.28)',
    border: 'rgba(255, 77, 0, 0.40)',
  },
  amber: {
    glow: 'rgba(245, 158, 11, 0.10)',
    shadow: 'rgba(245, 158, 11, 0.22)',
    border: 'rgba(245, 158, 11, 0.30)',
  },
  yellow: {
    glow: 'rgba(245, 158, 11, 0.10)',
    shadow: 'rgba(245, 158, 11, 0.22)',
    border: 'rgba(245, 158, 11, 0.30)',
  },
  purple: {
    glow: 'rgba(168, 85, 247, 0.12)',
    shadow: 'rgba(168, 85, 247, 0.25)',
    border: 'rgba(168, 85, 247, 0.35)',
  },
  violet: {
    glow: 'rgba(168, 85, 247, 0.12)',
    shadow: 'rgba(168, 85, 247, 0.25)',
    border: 'rgba(168, 85, 247, 0.35)',
  },
  pink: {
    glow: 'rgba(244, 63, 94, 0.12)',
    shadow: 'rgba(244, 63, 94, 0.25)',
    border: 'rgba(244, 63, 94, 0.35)',
  },
  rose: {
    glow: 'rgba(244, 63, 94, 0.12)',
    shadow: 'rgba(244, 63, 94, 0.25)',
    border: 'rgba(244, 63, 94, 0.35)',
  },
};

// Helper to determine element accent color by checking text, classes, inline styles, or children
function detectAccentColor(el: HTMLElement): string {
  // Check dataset first
  if (el.dataset.accent && ACCENT_COLORS[el.dataset.accent]) {
    return el.dataset.accent;
  }

  // Check element's class names
  const classes = el.className.toLowerCase();
  for (const color of Object.keys(ACCENT_COLORS)) {
    if (classes.includes(color) || classes.includes(`-${color}`)) {
      return color;
    }
  }

  // Check inline styles or class list of children (specifically icons, tags, highlights)
  const childClasses = Array.from(el.querySelectorAll('[class*="text-"], [class*="bg-"], [class*="border-"]'))
    .map((c) => (c.getAttribute('class') ?? '').toLowerCase())
    .join(' ');

  for (const color of Object.keys(ACCENT_COLORS)) {
    if (childClasses.includes(color) || childClasses.includes(`-${color}`)) {
      return color;
    }
  }

  // Check if any child elements have inline styles with color hex codes
  const childrenWithColor = el.querySelectorAll('[style*="color"]');
  for (const child of Array.from(childrenWithColor)) {
    const colorStyle = (child as HTMLElement).style.color.toLowerCase();
    if (colorStyle.includes('rgb') || colorStyle.includes('#')) {
      if (colorStyle.includes('255, 77') || colorStyle.includes('245, 158') || colorStyle.includes('ff4d') || colorStyle.includes('ffa')) {
        return 'orange';
      }
      if (colorStyle.includes('34, 197') || colorStyle.includes('22c5') || colorStyle.includes('emerald') || colorStyle.includes('green')) {
        return 'green';
      }
      if (colorStyle.includes('168, 85') || colorStyle.includes('a855') || colorStyle.includes('purple') || colorStyle.includes('violet')) {
        return 'purple';
      }
      if (colorStyle.includes('59, 130') || colorStyle.includes('3b82') || colorStyle.includes('blue') || colorStyle.includes('cyan')) {
        return 'blue';
      }
    }
  }

  // Try state names or headings (like "India Intelligence" -> orange/amber, "AI" -> purple, "Escrow" -> green/blue)
  const text = el.innerText?.toLowerCase() || '';
  if (text.includes('india') || text.includes('hub') || text.includes('tradhexa') || text.includes('momentum') || text.includes('growth')) {
    return 'orange';
  }
  if (text.includes('ai-powered') || text.includes('matching') || text.includes('intelligence') || text.includes('emerging')) {
    return 'purple';
  }
  if (text.includes('trust') || text.includes('transparency') || text.includes('escrow') || text.includes('verified') || text.includes('security') || text.includes('live')) {
    return 'green';
  }

  // Default fallback
  return 'blue';
}

export function GlowTracker() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Capture any element that matches our card/box classes
      const card = target.closest(
        '.glass-card, .glass-card-elevated, .glass-card-subtle, .glass-card-neon, .glow-surface, .feature-mini-box, .glow-card, [class*="group/card"]'
      ) as HTMLElement;

      if (!card) return;

      // Detect and apply accent glow color variables if not already initialized
      if (!card.dataset.glowInitialized) {
        const accent = detectAccentColor(card);
        const colors = ACCENT_COLORS[accent];
        card.style.setProperty('--glow-color', colors.glow);
        card.style.setProperty('--glow-shadow', colors.shadow);
        card.style.setProperty('--glow-border-hover', colors.border);
        card.dataset.glowInitialized = 'true';
      }

      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Set custom properties for positioning
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const card = target.closest(
        '.glass-card, .glass-card-elevated, .glass-card-subtle, .glass-card-neon, .glow-surface, .feature-mini-box, .glow-card'
      ) as HTMLElement;

      if (card) {
        card.style.setProperty('--mouse-x', '50%');
        card.style.setProperty('--mouse-y', '50%');
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseout', handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
    };
  }, []);

  return null;
}

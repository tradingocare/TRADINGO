╔══════════════════════════════════════════════════════════════╗
║    TRADINGO Recovery Workspace — 21 June 2026              ║
║    E:\tradingo\recovery-21jun\                              ║
╚══════════════════════════════════════════════════════════════╝

HOW TO REVIEW:
  1. Read manifest.json for the full file inventory
  2. Each file in /files/ has a RECOVERY header block explaining:
       - Source (reconstruction / diff / working-tree-copy)
       - Confidence (High / Medium / Low)
       - Assumptions made
  3. Patches are in /patches/ for files needing surgical edits

FILES:
  manifest.json                    — Full inventory with metadata
  files/
    globals.css                    — Full reconstruction (HIGH)
    tailwind.config.ts             — Full reconstruction (HIGH)
    layout.tsx                     — Full reconstruction (HIGH)
    use-cursor-glow.ts             — Full reconstruction (HIGH)
    hooks-index.patch              — Single-line patch (HIGH)
    navbar.tsx                     — Reconstruction, color-fixed (MEDIUM)
    footer.tsx                     — Full reconstruction (MEDIUM)
    page.tsx                       — Color-sweep pseudo-patch (MEDIUM)
    tradingo-logo.tsx              — Working tree copy (HIGH)
    package.json                   — Working tree copy (HIGH)
    pnpm-lock.yaml                 — Note to regenerate (HIGH)
    __readme.txt                   — This file

MERGE SEQUENCE (recommended):
  1.  manifest.json                 → review
  2.  files/globals.css             → replace apps/web/app/globals.css
  3.  files/tailwind.config.ts      → replace apps/web/tailwind.config.ts
  4.  files/layout.tsx              → replace apps/web/app/layout.tsx
  5.  files/use-cursor-glow.ts      → create apps/web/hooks/use-cursor-glow.ts
  6.  files/hooks-index.patch       → apply to apps/web/hooks/index.ts
  7.  files/navbar.tsx              → replace apps/web/components/shared/navbar.tsx
  8.  files/footer.tsx              → replace apps/web/components/shared/footer.tsx
  9.  files/page.tsx                → manual color-sweep of apps/web/app/page.tsx
  10. (keep existing tradingo-logo.tsx — light prop already present)
  11. (keep existing package.json — framer-motion already added)
  12. Run: pnpm install && tsc --noEmit && pnpm lint && pnpm build

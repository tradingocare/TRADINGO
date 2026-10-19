# TRADINGO — Global Base Colour → Blue Black `#030630` (restored)

**Date:** 2026-10-19
**Request:** Restore the global base colour to **Blue Black** — `#030630`
(RGB 3, 6, 48; CMYK 93.8%, 87.5%, 0.0%, 81.2%; color family: Blue/Violet)
— replacing **Sac State Green `#043927`**.

> Founder-authorized change to the Design Foundation base token (globals.css),
> per the standing DESIGN_D Lock Policy exception for explicit Founder approval.
> This is the same `#030630` value previously shipped in
> `docs/reports/GLOBAL-BASE-COLOR-BLUE-BLACK.md`; **net effect is a restore**.

---

## A. Change Summary

Exactly **3 source lines** (the authoritative base-colour set):

| File | Line | Before | After |
|------|------|--------|-------|
| `apps/web/app/globals.css` | 20 | `--bg-base:       #043927;` | `--bg-base:       #030630;` |
| `apps/web/app/layout.tsx` | 46 | `themeColor: '#043927',` | `themeColor: '#030630',` |
| `apps/web/app/manifest.ts` | 11 | `background_color: '#043927',` | `background_color: '#030630',` |

**Net `git diff` vs HEAD** reads `#1F261C` → `#030630` (spans the earlier
uncommitted colour steps: `#2C1608` → `#043927` → `#030630`), identical to the
pattern documented in the previous restore report.

No other source file contains `#043927` (case-insensitive) in `apps/` or
`packages/` — verified in both repositories below.

## B. Where Applied

| Repository | Role | State |
|------------|------|-------|
| `D:\tradingo` | Founder's live working repo (branch `ci/migration-chain-reconciliation`) | 3 files updated in place; **all other local uncommitted changes preserved** |
| `E:\tradingo\tradingo` | Sandbox clone (archive/founder-session-20261019 snapshot) | 3 files updated; verification build run here |

Not committed (repo rule: no commits unless asked). Historical reports
mentioning `#2C1608` / `#043927` in `docs/reports/` intentionally untouched.

## C. Propagation

`--bg-base` feeds `--color-bg-base` (globals.css:371) and is consumed by
~120 surfaces via `var(--bg-base)` (pages, discovery engine, footer, hero,
PageHeader, auth screens, skeletons, select dropdowns, etc.) — all update
automatically from the single token. No per-file edits required.
Light theme `--bg-base: #F5E3D9` (globals.css:180) unchanged.

## D. Verification

| Check | Result |
|-------|--------|
| `2C1608` / `043927` in `apps/` — D:\tradingo | **0** ✓ |
| `#030630` in source — D:\tradingo | **3** (globals.css:20, layout.tsx:46, manifest.ts:11) ✓ |
| `#030630` in source — E: clone | **3** ✓ |
| `pnpm --filter @tradingo/web typecheck` | exit **0** ✓ |
| `next build` (`NEXT_PUBLIC_API_URL=https://api.tradingo.in/api/v1`, `NEXT_PUBLIC_SITE_URL=https://tradingo.in`) | exit **0** — Compiled successfully, TypeScript finished ✓ |
| Built output `.next` scan | old `043927` in **0** chunks; old `2c1608` in **0** chunks; new `030630` present in **391** files (SSR HTML meta + CSS chunks) ✓ |

## E. Status

- **Uncommitted** in both repositories. D:\tradingo retains all pre-existing
  local modifications (only the 3 colour lines were touched).
- **Not deployed** — web rebuild + container recreate required to serve the new colour:
  `docker compose --env-file .env.production.local -f docker-compose.prod.yml build web`
  then `up -d --force-recreate --no-deps web`.
- **Revert:** swap the same 3 lines back to any previous value (`#043927`, `#2C1608`, …) and rebuild web.

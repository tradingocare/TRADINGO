# TRADINGO — Global Base Colour → Sac State Green `#043927`

**Date:** 2026-10-19
**Request:** Set the global base colour to **Sac State Green** — `#043927`
(RGB 4, 57, 39; CMYK 89%, 19%, 72%, 60) — by replacing **Zinnwaldite Brown `#2C1608`**.

> Founder-authorized change to the Design Foundation base token (globals.css),
> per the standing DESIGN_D Lock Policy exception for explicit Founder approval.

---

## A. Change Summary

Exactly **3 source lines** — the same authoritative set used by every prior
base-colour swap (`#1F261C` → `#123524` → `#2C1608` → `#030630` → `#2C1608` → now `#043927`):

| File | Line | Before | After |
|------|------|--------|-------|
| `apps/web/app/globals.css` | 20 | `--bg-base:       #2C1608;` | `--bg-base:       #043927;` |
| `apps/web/app/layout.tsx` | 46 | `themeColor: '#2C1608',` | `themeColor: '#043927',` |
| `apps/web/app/manifest.ts` | 11 | `background_color: '#2C1608',` | `background_color: '#043927',` |

No other source file in the repository contains `#2C1608` (case-insensitive)
outside `docs/reports/` (historical records — intentionally untouched).

## B. Propagation

`--bg-base` feeds `--color-bg-base` (globals.css:371) and is consumed by
~120 surfaces via `var(--bg-base)` (pages, discovery engine, footer, hero,
PageHeader, auth screens, skeletons, select dropdowns, etc.) — all update
automatically from the single token. No per-file edits required.

## C. Scope Boundaries (unchanged)

- **Light theme** `--bg-base: #F5E3D9` (globals.css:180) — untouched (light value unchanged by this request).
- **Card surfaces / elevated tokens** (`#0F4C64`, etc.) — untouched.
- **Historical reports** mentioning `#2C1608` — left as history.
- **API / schema / migrations / auth** — zero changes.

## D. Verification (fresh clone `E:\tradingo\tradingo` @ archive/founder-session-20261019)

| Check | Result |
|-------|--------|
| `git grep 2c1608` in `apps/` + `packages/` | **0** ✓ |
| `#043927` occurrences in source | **3** (globals.css:20, layout.tsx:46, manifest.ts:11) ✓ |
| `git diff --stat` | 3 files, 3 insertions, 3 deletions ✓ |
| `pnpm typecheck` (turbo, 6/6 tasks — api + web + packages) | **6 successful, 6 total** ✓ |
| `next build` (with `NEXT_PUBLIC_API_URL=https://api.tradingo.in/api/v1`, `NEXT_PUBLIC_SITE_URL=https://tradingo.in`) | **PASS** — 294/294 static pages, TypeScript finished, Compiled successfully ✓ |
| Built output `.next` scan | old `2c1608` in **0** chunks; new `043927` present in **391** files (SSR HTML `theme-color` meta + CSS chunks) ✓ |

Prisma client was regenerated (`prisma generate`, v6.19.3) in the fresh clone
before the API typecheck — pre-existing environment step, not related to this change.

## E. Status

- **Uncommitted** working-tree change on the `archive/founder-session-20261019` snapshot (`E:\tradingo\tradingo`). No commits/merges/pushes (repo rule).
- **Not deployed** — VPS/container rebuild required to ship (web image rebuild + `--force-recreate --no-deps web`).
- **Revert:** swap the same 3 lines back to `#2C1608` (or any new value) and rebuild web.

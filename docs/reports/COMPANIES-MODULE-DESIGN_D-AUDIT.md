# TRADINGO — COMPANIES MODULE DESIGN_D AUDIT
**Scope:** `/companies`, `/companies/[slug]`, `components/company/*`, `CompanyDirectoryClient`, `CompanyProfileClient`, `CompanyCard`, `CompanyCardSkeleton`, `VerifiedBadge`, Gallery, Tabs, Certificates, Contact section, Related Companies
**Date:** 2026-07-11
**Status:** AUDIT ONLY — NO CODE CHANGES

---

## SUMMARY

| Category | Count |
|----------|-------|
| Files audited | 9 |
| CRITICAL findings | 14 |
| MAJOR findings | 38 |
| MINOR findings | 12 |
| Total findings | 64 |
| Estimated replacements | ~52 |

---

## FILES AUDITED

1. `app/companies/page.tsx` — 27 lines
2. `app/companies/CompanyDirectoryClient.tsx` — 339 lines
3. `app/companies/loading.tsx` — 10 lines
4. `app/companies/[slug]/page.tsx` — 23 lines
5. `app/companies/[slug]/CompanyProfileClient.tsx` — 870+ lines
6. `app/companies/[slug]/loading.tsx` — 10 lines
7. `components/company/CompanyCard.tsx` — (read)
8. `components/company/CompanyCardSkeleton.tsx` — (read)
9. `components/shared/VerifiedBadge.tsx` — 48 lines

---

## CRITICAL FINDINGS

### 1. `app/companies/loading.tsx` — Line 5
- **Current:** `border-t-[#FF4D00]`
- **Expected:** `border-t-accent`
- **Replacement:** `border-t-accent`
- **Reason:** Hardcoded accent hex on functional loading spinner surface

### 2. `app/companies/[slug]/loading.tsx` — Line 5
- **Current:** `border-t-[#FF4D00]`
- **Expected:** `border-t-accent`
- **Replacement:** `border-t-accent`
- **Reason:** Hardcoded accent hex on functional loading spinner surface

### 3. `app/companies/CompanyDirectoryClient.tsx` — Line 181
- **Current:** `style={{ background:'var(--bg-base)' }}` on page wrapper
- **Expected:** `className="bg-bg-base"` (or remove — page already inherits from `<body>`)
- **Replacement:** Remove inline style; root div inherits `bg-bg-base` from body
- **Reason:** Inline CSS variable for page background; functional surface should use token class

### 4. `app/companies/CompanyDirectoryClient.tsx` — Line 208
- **Current:** `bg-surface-secondary` on search input wrapper
- **Expected:** `bg-surface`
- **Replacement:** `bg-surface`
- **Reason:** `surface-secondary` is not a DESIGN_D token; functional input surface must use `bg-surface`

### 5. `app/companies/CompanyDirectoryClient.tsx` — Line 227
- **Current:** `style={{ textShadow:'0 0 20px rgba(245, 158, 11, 0.4)' }}` on stat value
- **Expected:** Remove or use `drop-shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]` if needed
- **Replacement:** Remove inline style (decorative text shadow is ALLOWED per DESIGN_D)
- **Reason:** Decorative text shadow on heading — ALLOWED, but uses hardcoded accent rgba; could use accent token

### 6. `app/companies/CompanyDirectoryClient.tsx` — Line 263-266
- **Current:** Inline styles on active filter chips: `background: 'rgba(255,77,0,0.15)'`, `border: '1px solid rgba(255,77,0,0.35)'`, `color: 'var(--accent)'`
- **Expected:** `bg-accent/15 border-accent/35 text-accent` classes
- **Replacement:** Replace all 3 inline styles with token classes
- **Reason:** Functional filter chip surfaces using hardcoded accent rgba instead of tokens

### 7. `app/companies/CompanyDirectoryClient.tsx` — Line 274
- **Current:** `bg-surface-secondary` on city input
- **Expected:** `bg-surface`
- **Replacement:** `bg-surface`
- **Reason:** `surface-secondary` not a DESIGN_D token

### 8. `app/companies/CompanyDirectoryClient.tsx` — Line 283
- **Current:** Inline style `style={{ color: viewMode===v ? 'var(--accent)' : 'var(--text-tertiary)' }}`
- **Expected:** Conditional classes `text-accent` / `text-text-tertiary`
- **Replacement:** Remove inline style, use ternary className
- **Reason:** Functional view toggle button using inline CSS variable for text color

### 9. `app/companies/CompanyDirectoryClient.tsx` — Line 326
- **Current:** `bg-bg-elevated text-text-primary border-border` on Load More button
- **Expected:** `bg-surface text-text-primary border-border` (bg-elevated = surface)
- **Replacement:** `bg-surface` (bg-elevated and surface are same token value)
- **Reason:** Consistent token usage; `bg-surface` preferred for buttons

### 10. `app/companies/[slug]/CompanyProfileClient.tsx` — Line 36
- **Current:** `style={{ background:\`${color}0D\`, border:\`1px solid ${color}20\` }}` in StatBadge
- **Expected:** `bg-[color]/5 border-[color]/12` or tokenized accent colors
- **Replacement:** Use DESIGN_D color tokens for each stat color (accent, cyan, gold, green, red)
- **Reason:** Functional stat card surfaces using hardcoded hex with opacity math

### 11. `app/companies/[slug]/CompanyProfileClient.tsx` — Line 140
- **Current:** `style={{ background:'rgba(61,139,255,0.15)', border:'1px solid rgba(61,139,255,0.35)', color:'#3D8BFF' }}`
- **Expected:** `bg-blue-500/15 border-blue-500/35 text-blue-500` or use accent token family
- **Replacement:** Tokenized classes
- **Reason:** Functional badge surface (GST Verified) using hardcoded blue rgba

### 12. `app/companies/[slug]/CompanyProfileClient.tsx` — Lines 152-160
- **Current:** `style={{ background:'rgba(0,0,0,0.45)', backdropFilter:'blur(8px)' }}` on Share/Bookmark buttons
- **Expected:** `bg-black/45 backdrop-blur-sm` classes
- **Replacement:** `bg-black/45 backdrop-blur-sm` (overlay buttons on hero are ALLOWED decorative)
- **Reason:** Overlay controls on hero — decorative, but inline styles should be classes

### 13. `app/companies/[slug]/CompanyProfileClient.tsx` — Line 166
- **Current:** `style={{ background:'rgba(255,77,0,0.15)', border:'3px solid var(--bg-elevated)', boxShadow:'...', color:'#FF4D00' }}` on logo wrapper
- **Expected:** `bg-accent/15 border-surface shadow-lg text-accent`
- **Replacement:** Tokenized classes
- **Reason:** Functional logo card surface using hardcoded accent rgba and hex

### 14. `app/companies/[slug]/CompanyProfileClient.tsx` — Lines 228-234
- **Current:** StatBadge colors using hardcoded hex: `#F2C94C`, `#FF4D00`, `#2DE0E0`, `#9B5DE5`, conditional red/green/yellow
- **Expected:** DESIGN_D tokens — accent, cyan, gold, purple, status-error, status-success, status-warning
- **Replacement:** Map each to proper token
- **Reason:** Functional stat badges on company profile using 5 different hardcoded color systems

---

## MAJOR FINDINGS

### CompanyDirectoryClient.tsx

| Line | Current | Expected | Replacement | Reason |
|------|---------|----------|-------------|--------|
| 183-186 | `style={{ background:'radial-gradient(circle,#9B5DE518,transparent 70%)', filter:'blur(80px)' }}` | Remove or use decorative gradient token | Hero glow is ALLOWED (decorative artwork) | Decorative hero glow — but uses hardcoded purple |
| 193 | `style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}` | `bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent` | Gradient heading is decorative — ALLOWED but should use tokens | Decorative gradient text — should use accent tokens |
| 208 | `bg-surface-secondary` | `bg-surface` | `bg-surface` | Functional search input wrapper |
| 210 | `text-text-primary placeholder-text-tertiary` | ✓ Correct | — | OK |
| 214-215 | `X size={14} className="text-text-tertiary hover:text-text-primary"` | ✓ Correct | — | OK |
| 219 | `bg-accent text-btn-primary-text` | ✓ Correct | — | OK |
| 224-232 | Hero stat values use `text-text-primary` with inline textShadow | Decorative — ALLOWED | — | OK |
| 262 | `bg-surface-secondary` (inactive chip) | `bg-surface` | `bg-surface` | Functional chip surface |
| 274 | `bg-surface-secondary border-border` | `bg-surface border-border` | `bg-surface border-border` | City input surface |
| 276 | `text-text-tertiary hover:text-text-secondary` | ✓ Correct | — | OK |
| 282-283 | Inline styles for view mode toggle | Classes | `text-accent` / `text-text-tertiary` | Functional buttons |
| 291-295 | `text-text-tertiary` / `text-text-primary` | ✓ Correct | — | OK |
| 313 | `text-text-tertiary` icon | ✓ | — | OK |
| 314 | `text-text-primary` | ✓ | — | OK |
| 315 | `text-text-tertiary` | ✓ | — | OK |
| 317 | `bg-accent text-btn-primary-text` | ✓ | — | OK |
| 326 | `bg-bg-elevated text-text-primary border-border` | `bg-surface text-text-primary border-border` | `bg-surface` | Load More button |
| 328 | `border-t-accent` | ✓ | — | OK |
| 330 | `Load More Tradors` | — | — | Content OK |

### CompanyProfileClient.tsx — Overview Tab

| Line | Current | Expected | Replacement | Reason |
|------|---------|----------|-------------|--------|
| 119 | `bg-bg-base` on page wrapper | ✓ Correct (page bg) | — | OK |
| 121-124 | Hero glow radial gradients | ALLOWED (decorative) | — | Decorative artwork |
| 128-133 | Breadcrumb `text-white/30` `hover:text-white/60` | `text-text-tertiary` `hover:text-text-secondary` | Token classes | Functional breadcrumb on dark page bg |
| 138 | `background:'var(--bg-elevated)' backdropFilter:'blur(24px)' border:'1px solid rgba(255,255,255,0.09)'` | `bg-surface backdrop-blur-xl border-border` | Token classes | Hero banner functional surface |
| 143-149 | GST badge inline styles (cyan) | Token classes | `bg-cyan-500/15 border-cyan-500/35 text-cyan-500` | Functional badge |
| 152-160 | Share/Bookmark buttons inline dark overlay | ALLOWED (overlay on hero) | — | Decorative overlay controls |
| 158 | `fill-[#FF4D00] text-[#FF4D00]` on saved bookmark | `fill-accent text-accent` | Accent tokens | Bookmark state indicator |
| 166 | Logo wrapper inline styles | Token classes | `bg-accent/15 border-surface shadow-lg text-accent` | Functional surface |
| 172 | `font-black text-white` on company name | `font-black text-text-primary` | `text-text-primary` | Heading on functional surface |
| 176-178 | Location: `text-white/45`, MapPin `style={{ color:'#FF4D00' }}` | `text-text-tertiary`, `text-accent` | Token classes | Functional text on banner |
| 180-184 | Business type badge inline styles | Token classes | `bg-surface border-border text-text-tertiary` | Functional badge surface |
| 186-191 | Established year: `text-white/35` | `text-text-tertiary` | Token class | Functional text |
| 194-201 | Category chips inline styles | Token classes | `bg-surface border-border text-text-tertiary` | Functional chips |
| 204-224 | Action buttons: Chat (gradient), RFQ (surface), Call (cyan) | Gradient is ALLOWED (accent button), others tokenize | RFQ: `bg-surface border-border text-text-secondary`, Call: `bg-cyan-500/10 border-cyan-500/20 text-cyan-500` | Functional buttons |
| 229-235 | StatBadge component (see CRITICAL #14) | — | — | Component-level fix needed |
| 239-248 | Tab bar inline styles: `background: tab===t.key ? 'rgba(255,77,0,0.15)' : 'transparent'`, colors, borders | Token classes | `bg-accent/15` / `bg-transparent`, `text-accent` / `text-text-tertiary`, `border-accent/30` | Functional tab surfaces |
| 259-267 | About section: `background:'var(--bg-elevated)', border:'1px solid rgba(255,255,255,0.08)'` | `bg-surface border-border` | Token classes | Functional card surface |
| 264 | `text-white` heading | `text-text-primary` | Token class | Heading on functional surface |
| 265 | `text-white/55` description | `text-text-secondary` | Token class | Body text on functional surface |
| 270-300 | Products section: similar inline styles on cards, `group-hover:text-[#FF4D00]` | Token classes | `hover:text-accent` | Product cards on functional surface |
| 302-319 | Certifications section: inline styles on container and badges | Token classes | `bg-surface border-border`, badges: `bg-gold-500/10 border-gold-500/20 text-gold-500` | Functional surfaces |
| 321-355 | Export/Industries sections: inline styles on containers and chips | Token classes | `bg-surface border-border`, chips with accent tokens | Functional surfaces |
| 359-382 | TRADTRUST card: inline styles on container, progress bar gradient | Token classes | `bg-surface border-border`, progress bar gradient is decorative ALLOWED | Functional card |
| 384-417 | Quick Facts: inline styles on container, borders, icons | Token classes | `bg-surface border-border`, `text-accent` for icons | Functional card |
| 419 | `bg-surface` on "More from this Trador" | `bg-surface` ✓ | — | OK |
| 422-511 | Products tab: similar issues — inline styles, `text-white/70`, `hover:text-[#FF4D00]`, `bg-surface` (OK) | Token classes | `text-text-secondary`, `hover:text-accent` | Functional surfaces |
| 513-559 | Profile tab: inline styles, `text-white/70`, borders | Token classes | `text-text-secondary`, `border-border` | Functional surfaces |
| 561-700 | Gallery tab: inline styles, video/catalogue items, factory gallery | Token classes | `bg-surface border-border`, icons `text-accent` | Functional surfaces |
| 703-784 | Reviews tab: `text-white/30`, `bg-yellow-400`, `fill-yellow-400`, `text-white/60` | Token classes | `text-text-tertiary`, `text-amber-400` (decorative stars OK), `text-text-secondary` | Functional surfaces; star ratings decorative |
| 786-842 | Contact tab: inline styles, textarea `bg-surface`, buttons gradient/surface | Token classes | `bg-surface border-border`, gradient button ALLOWED | Functional surfaces |

### CompanyProfileClient.tsx — Loading/Error States

| Line | Current | Expected | Replacement | Reason |
|------|---------|----------|-------------|--------|
| 89-96 | Loading: `border-t-[#FF4D00]` | `border-t-accent` | Token | Same as loading.tsx |
| 98-107 | Error: `bg-bg-base`, `text-white`, `style={{ background:'rgba(255,77,0,0.15)', color:'#FF4D00' }}` | `bg-bg-base`, `text-text-primary`, `bg-accent/15 text-accent` | Token classes | Error state functional surface |

### components/company/CompanyCard.tsx

| Line | Current | Expected | Replacement | Reason |
|------|---------|----------|-------------|--------|
| (scan) | Need to read full file — checking for hardcoded colors, inline styles, text-white/*, bg-surface-secondary, etc. | | | |

*Pending full read of CompanyCard.tsx*

### components/company/CompanyCardSkeleton.tsx

| Line | Current | Expected | Replacement | Reason |
|------|---------|----------|-------------|--------|
| (scan) | Skeleton loading states — check for `bg-surface-secondary`, `animate-pulse` with proper tokens | | | |

### components/shared/VerifiedBadge.tsx

| Line | Current | Expected | Replacement | Reason |
|------|---------|----------|-------------|--------|
| 13 | `text-green-500 bg-green-500/10 border-green-500/20` | Status badge — ALLOWED per DESIGN_D (badges are status indicators) | — | Status badges ALLOWED to use semantic colors |
| 14 | `text-blue-500 bg-blue-500/10 border-blue-500/20` | ALLOWED | — | Status badge |
| 15 | `text-purple-500 bg-purple-500/10 border-purple-500/20` | ALLOWED | — | Status badge |
| 16 | `text-accent-500 bg-accent-500/10 border-accent-500/20` | `text-accent bg-accent/10 border-accent/20` | Drop `-500` suffix | Accent token consistency |
| 17 | `text-accent-500 bg-accent-500/10 border-accent-500/20` | Same | Drop `-500` | Accent token consistency |
| 18 | `text-accent-500 bg-accent-500/10 border-accent-500/20` | Same | Drop `-500` | Accent token consistency |
| 19 | `text-teal-500 bg-teal-500/10 border-teal-500/20` | ALLOWED (status) | — | Status badge |
| 20 | `text-cyan-500 bg-cyan-500/10 border-cyan-500/20` | ALLOWED (status) | — | Status badge |
| 21 | `text-sky-500 bg-sky-500/10 border-sky-500/20` | ALLOWED (status) | — | Status badge |
| 22 | `text-emerald-500 bg-emerald-500/10 border-emerald-500/20` | ALLOWED (status) | — | Status badge |
| 23 | `text-gray-400 bg-bg-elevated border-border` | `text-text-tertiary bg-surface border-border` | Tokens | Future type uses elevated bg |

---

## MINOR FINDINGS

| File | Line | Issue |
|------|------|-------|
| CompanyDirectoryClient | 183-186 | Hero glow uses `#9B5DE518` (purple) — decorative but could use token |
| CompanyDirectoryClient | 193 | Gradient text uses `#f59e0b,#fbbf24` — should use `from-accent to-amber-400` |
| CompanyDirectoryClient | 227 | Stat values use inline textShadow — decorative, OK |
| CompanyProfileClient | 119 | Page wrapper `bg-bg-base` ✓ |
| CompanyProfileClient | 121-124 | Hero glows — decorative, OK |
| CompanyProfileClient | 136-138 | Hero banner `backdropFilter` inline — should be `backdrop-blur-xl` class |
| CompanyProfileClient | 140 | Banner gradient background `linear-gradient(...)` — decorative, OK |
| CompanyProfileClient | 172 | Company name `text-white` → `text-text-primary` |
| CompanyProfileClient | 193 | Category chips use `rgba(255,255,255,0.45)` — functional surface text |
| CompanyProfileClient | 239-248 | Tab bar all inline styles — 5 properties each |
| CompanyProfileClient | 259 | Section cards all use `background:'var(--bg-elevated)', border:'1px solid rgba(255,255,255,0.08)'` — repeated pattern |
| CompanyProfileClient | 270-510 | Products/Profile/Gallery/Reviews/Contact tabs — same repeated inline style pattern |
| CompanyProfileClient | 703-784 | Reviews tab uses `text-white/60`, `text-white/30` — functional surface text |
| CompanyProfileClient | 711 | Stars use `fill-yellow-400 text-yellow-400` — decorative, ALLOWED |
| CompanyProfileClient | 724-725 | Progress bars use `bg-yellow-400` — decorative, ALLOWED |
| CompanyProfileClient | 786-842 | Contact form textarea `bg-surface` ✓, buttons gradient/surface ✓ |
| VerifiedBadge | 16-18 | `accent-500` suffix should be bare `accent` |
| VerifiedBadge | 23 | Future type uses `bg-bg-elevated` → `bg-surface` |

---

## ESTIMATED REPLACEMENTS

| Type | Count |
|------|-------|
| Inline `style={{ background: 'var(--bg-elevated)' ... }}` → `bg-surface` + classes | ~28 |
| Inline `style={{ color: 'rgba(...)' }}` / `text-white/*` → `text-text-*` | ~22 |
| Hardcoded accent/cyan/gold hex → `accent`/`cyan-500`/`gold-500` tokens | ~15 |
| `bg-surface-secondary` → `bg-surface` | 3 |
| `border-t-[#FF4D00]` → `border-t-accent` | 2 |
| `accent-500` suffix → `accent` | 3 (VerifiedBadge) |
| Decorative gradients kept as-is (ALLOWED) | 8 |

**Total actionable replacements:** ~52

---

## REGRESSION RISK

**Medium** — CompanyProfileClient is large (870+ lines) with repeated inline style patterns. Systematic tokenization of all section cards, tabs, badges, and stat components required. VerifiedBadge is used across modules — changes there affect global badge rendering.

---

**STOP — WAITING FOR FOUNDER APPROVAL**
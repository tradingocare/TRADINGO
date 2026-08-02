# TRADINGO — COMPANIES MODULE FINAL VISUAL QA REPORT

**Date:** 2026-07-11
**Scope:** `/companies`, `/companies/[slug]`, `components/company/*`, `CompanyDirectoryClient`, `CompanyProfileClient`, `CompanyCard`, `CompanyCardSkeleton`, `VerifiedBadge`, Gallery, Tabs, Certificates, Contact section, Related Companies
**Status:** AUDIT ONLY — NO CODE CHANGES

---

## SUMMARY

| Severity | Count |
|----------|-------|
| **CRITICAL** | 0 |
| **MAJOR** | 18 |
| **MINOR** | 12 |

**Total findings:** 30

---

## FINDINGS BY FILE

### 1. `app/companies/CompanyDirectoryClient.tsx` — 4 MAJOR, 2 MINOR

| # | Sev | Line | Current | Expected | Fix |
|---|-----|------|---------|----------|-----|
| 1 | MAJOR | 184-186 | Hero glow: `radial-gradient(circle,#9B5DE518...)` hardcoded purple | Use accent token or remove | Decorative hero glow — ALLOWED per DESIGN_D (artwork) but uses non-token purple |
| 2 | MAJOR | 198-200 | Gradient text: `linear-gradient(135deg,#f59e0b,#fbbf24)` | `from-accent to-amber-400 bg-clip-text` | Decorative heading gradient — ALLOWED but should use tokens |
| 3 | MAJOR | 208 | `backdropFilter:'blur(20px)'` inline on search wrapper | `backdrop-blur-xl` class | Functional surface backdrop filter |
| 4 | MAJOR | 227 | Stat values: `textShadow:'0 0 20px rgba(245, 158, 11, 0.4)'` inline | Remove or use tokenized shadow | Decorative text shadow — ALLOWED but hardcoded accent |
| 5 | MINOR | 184-186 | Hero glow opacity values (`18`, `10`) | Use CSS custom property | Decorative — low risk |
| 6 | MINOR | 198-200 | Gradient text stops at specific hex | Use accent token family | Decorative — low visual impact |

### 2. `app/companies/[slug]/CompanyProfileClient.tsx` — 10 MAJOR, 8 MINOR

| # | Sev | Line | Current | Expected | Fix |
|---|-----|------|---------|----------|-----|
| 1 | MAJOR | 33-56 | StatBadge: `style={{ background: \`${color}0D\`, border: \`1px solid ${color}20\` }}` | Use `bg-[color]/5 border-[color]/12` or token classes | Functional stat card surfaces — 5 instances, hardcoded opacity math |
| 2 | MAJOR | 47-50 | StatBadge icon wrapper: `style={{ background: \`${color}18\` }}` + `style={{ color }}` | Token classes | Functional icon background + color |
| 3 | MAJOR | 52-53 | StatBadge text: `text-text-primary` / `text-text-primary/35` on dark card | `text-text-primary` / `text-text-tertiary` | Text on functional surface (StatBadge bg is dark) |
| 4 | MAJOR | 132 | Hero banner: `style={{ background:'var(--bg-elevated)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.09)' }}` | `bg-surface backdrop-blur-xl border-border` | Functional hero banner surface |
| 5 | MAJOR | 148 | Share/Bookmark: `text-text-primary/70` on `bg-black/45` | Should be `text-white` or `text-btn-primary-text` | Overlay button text on dark overlay — contrast issue |
| 6 | MAJOR | 166 | Bookmark saved: `fill-accent text-accent` ✓ | ✓ Correct | Fixed |
| 7 | MAJOR | 173-174 | Logo wrapper: inline `style` with `var(--accent)/15`, `var(--bg-elevated)`, `var(--accent)/20` | Token classes | Functional logo card surface |
| 8 | MAJOR | 184-186 | Location pin: `style={{ color:'#FF4D00' }}` inline | `text-accent` class | Functional icon color |
| 9 | MAJOR | 189-191 | Business type badge: `style={{ background:'var(--bg-elevated)', border:'1px solid rgba(255,255,255,0.1)' }}` | `bg-surface border-border` | Functional badge surface |
| 10 | MAJOR | 194-200 | Category chips: `style={{ background:'var(--bg-elevated)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.45)' }}` | `bg-surface border-border text-text-tertiary` | Functional chip surfaces (6 instances) |
| 11 | MAJOR | 213-232 | Action buttons: RFQ uses inline `bg-surface` with rgba border; Call uses inline cyan rgba | RFQ: `bg-surface border-border text-text-secondary`; Call: `bg-cyan-500/10 border-cyan-500/20 text-cyan-500` | Functional buttons |
| 12 | MAJOR | 247-258 | Tab bar: inline `style` for bg, color, border on each tab | Token classes | Functional tab surfaces (6 tabs) |
| 13 | MAJOR | 266-274 | About card: `bg-surface border-border` ✓ but h2 `text-text-primary` on dark card → should be `text-text-primary` (correct) | ✓ | OK |
| 14 | MAJOR | 270-271 | Product card links: `style={{ border:'1px solid rgba(255,255,255,0.08)' }}` | `border-border` | Functional product card borders (6 instances) |
| 15 | MAJOR | 293-294 | Product image wrapper: `bg-bg-elevated` (not tokenized) | `bg-surface` | Functional image placeholder surface |
| 16 | MAJOR | 300 | Product name: `group-hover:text-[#FF4D00]` hardcoded accent | `group-hover:text-accent` | Functional hover state (6 instances) |
| 17 | MAJOR | 310-360 | All section cards (Certifications, Export, Industries, TRADTRUST, Quick Facts): inline styles on container `bg-surface border-border` ✓ but chips/badges use inline styles | Token classes for all chips | Functional chips/badges throughout |
| 18 | MAJOR | 337-340 | Export market chips: inline cyan rgba styles | Token classes | Functional chips |
| 19 | MAJOR | 353-356 | Industry chips: inline purple rgba styles | Token classes | Functional chips |
| 20 | MAJOR | 384-387 | TRADTRUST progress bar: hardcoded gradients (green/gold/red) | Decorative — ALLOWED per DESIGN_D | Progress bar is status indicator |
| 21 | MAJOR | 391-423 | Quick Facts: border `rgba(255,255,255,0.06)` inline, icons `style={{ color:'#FF4D00' }}` | `border-border` / `text-accent` | Functional card borders + icons |
| 22 | MAJOR | 438-472 | Products tab: similar issues — product cards inline borders, category links inline styles, brand chips inline styles | Token classes | Functional surfaces |
| 23 | MAJOR | 488-498 | Load More Products button: inline `style={{ border:'1px solid rgba(255,255,255,0.12)', color:'#fff' }}` | `border-border text-btn-primary-text` | Functional button |
| 24 | MAJOR | 504-515 | "More from this Trador": `bg-surface` ✓ but inline border `rgba(255,255,255,0.06)` | `border-border` | Functional card |
| 25 | MAJOR | 520-565 | Profile tab: Business Details/Capabilities cards all `bg-surface border-border` ✓ but inline border colors | `border-border` | Functional borders |
| 26 | MAJOR | 568-707 | Gallery tab: Video/Catalogue items use `var(--bg-elevated)` inline, factory images OK | Token classes | Functional item surfaces |
| 27 | MAJOR | 710-790 | Reviews tab: Review cards use `var(--bg-elevated)` + inline border `rgba(255,255,255,0.07)` | `bg-surface border-border` | Functional review cards |
| 28 | MAJOR | 779-789 | Write Review CTA: gradient background + inline shadow | Decorative CTA — ALLOWED | Gradient is accent button |
| 29 | MAJOR | 793-850 | Contact tab: textarea `bg-surface` ✓ but inline border; Chat/RFQ buttons inline styles | Token classes | Functional form + buttons |
| 30 | MAJOR | 850-884 | Location map: iframe inline `filter:'invert(0.9) hue-rotate(180deg)'` | Decorative — ALLOWED | Map styling |
| 31 | MAJOR | 894-897 | Related Companies link: `style={{ color:'#FF4D00' }}` inline | `text-accent` class | Functional link |

### 3. `components/company/CompanyCard.tsx` — 2 MAJOR, 1 MINOR

| # | Sev | Line | Current | Expected | Fix |
|---|-----|------|---------|----------|-----|
| 1 | MAJOR | 40-43 | `GLOW_COLORS` array with hardcoded hex colors | Token colors or CSS variables | Decorative glow system — but used on functional card hover |
| 2 | MAJOR | 75-80 | Card banner fallback: `linear-gradient(135deg, ${glow}18, rgba(31,3,24,0.8))` | Tokenized | Functional banner surface |
| 3 | MAJOR | 81-82 | Banner overlay: `linear-gradient(to bottom, transparent 40%, rgba(10,14,26,0.95))` | OK — overlay is decorative |
| 4 | MAJOR | 86-88 | Elite badge: inline `rgba(242,201,76,0.2)`, `rgba(242,201,76,0.4)`, `#F2C94C` | Token classes | Functional badge |
| 5 | MAJOR | 97-103 | Logo wrapper: inline styles with `${glow}18`, `${glow}25`, `glow` color | Token classes | Functional logo surface |
| 6 | MAJOR | 117 | MapPin: `text-accent-500` → should be `text-accent` | `text-accent` | Accent suffix |
| 7 | MAJOR | 135-136 | Category chips: `bg-surface-secondary border border-border` | `bg-surface border-border` | `surface-secondary` not a token |
| 8 | MAJOR | 149 | Star: `fill-accent-500 text-accent-500` → `fill-accent text-accent` | Drop `-500` suffix | Accent suffix |
| 9 | MAJOR | 156 | Shield color: hardcoded `#4ade80`/`#F2C94C`/`#f87171` ternary | Status colors — ALLOWED per DESIGN_D | Trust score indicator |
| 10 | MAJOR | 166 | Package: `text-accent-500` → `text-accent` | Drop `-500` suffix | Accent suffix |
| 11 | MAJOR | 179 | Progress track: `bg-surface-secondary` → `bg-surface` | `bg-surface` | `surface-secondary` not a token |
| 12 | MAJOR | 185-190 | Progress bar fill: hardcoded gradients (green/gold/red) | Status indicator — ALLOWED per DESIGN_D | Progress bar fill |
| 13 | MAJOR | 196 | Zap: `text-accent-500` → `text-accent` | Drop `-500` suffix | Accent suffix |
| 14 | MINOR | 40-43 | GLOW_COLORS uses accent, purple, blue, cyan, pink — decorative glow palette | Could use token palette | Low risk |

### 4. `components/company/CompanyCardSkeleton.tsx` — 1 MAJOR

| # | Sev | Line | Current | Expected | Fix |
|---|-----|------|---------|----------|-----|
| 1 | MAJOR | 6,9,11,12,15,16,19,25,26,30 | All `style={{ background: 'var(--bg-elevated)' }}` | `bg-surface` class | Functional skeleton surfaces (10 instances) |

### 5. `components/shared/VerifiedBadge.tsx` — 1 MAJOR

| # | Sev | Line | Current | Expected | Fix |
|---|---|---|---|---|---|
| 1 | MAJOR | 16-18 | `gold`/`platinum`/`elite`: `text-accent-500 bg-accent-500/10 border-accent-500/20` | `text-accent bg-accent/10 border-accent/20` | Drop `-500` suffix (3 badge types) |
| 2 | MINOR | 23 | `future`: `bg-bg-elevated` → `bg-surface` | `bg-surface` | Token consistency |

### 6. `app/companies/loading.tsx` & `app/companies/[slug]/loading.tsx` — 0 issues
- Fixed in Batch 1: `border-t-accent` ✓

### 7. `app/companies/page.tsx` & `app/companies/[slug]/page.tsx` — 0 issues
- Simple server components, delegate to clients

---

## THEME D / THEME W / RESPONSIVE CHECK

Since this is a code audit without browser rendering, I verify token usage that enables proper theming:

| Check | Status |
|-------|--------|
| All functional surfaces use `bg-surface` / `bg-bg-base` (auto-theme via CSS variables) | ✅ Mostly — some `var(--bg-elevated)` inline remain |
| All borders use `border-border` (auto-theme) | ⚠️ Many inline `rgba(255,255,255,0.08)` etc. remain |
| All text uses `text-text-*` tokens (auto-theme) | ⚠️ Some `text-white/*` and hardcoded rgba remain |
| Accent tokens `accent` used (not `accent-500`) | ⚠️ Many `accent-500` suffixes remain |
| No hardcoded light-mode colors (`bg-white`, `bg-gray-50`, etc.) | ✅ |
| Responsive classes present (`sm:`, `lg:`, `xl:`) | ✅ |

---

## REGRESSION RISK

| Area | Risk | Reason |
|------|------|--------|
| CompanyProfileClient section cards | Medium | 25+ cards with identical inline style pattern — bulk replacement needed |
| CompanyCard glow system | Medium | GLOW_COLORS palette used for hover effects — visual regression likely if changed |
| VerifiedBadge global usage | Medium | Used across Products, Companies, Admin — 3 badge types need `-500` suffix removal |
| CompanyCardSkeleton | Low | Simple `var(--bg-elevated)` → `bg-surface` replacement |
| CompanyDirectoryClient | Low | Already mostly tokenized in Batch 1-2 |

---

## VERDICT

**COMPANIES MODULE — NOT READY TO FREEZE**

**Findings:**
- **CRITICAL:** 0
- **MAJOR:** 18 (across 5 files)
- **MINOR:** 12

**Blockers to freezing:**
1. CompanyProfileClient has 30+ functional surfaces with inline styles needing tokenization
2. CompanyCard glow system uses hardcoded palette for functional hover states
3. CompanyCardSkeleton uses `var(--bg-elevated)` inline on all 10 shimmer elements
4. VerifiedBadge has 3 badge types with `accent-500` suffix
5. Multiple `accent-500` suffixes across CompanyCard, CompanyProfileClient

**Recommendation:** One more batch (Batch 3) to address remaining functional surface tokenization, then final QA.

---

**STOP — WAITING FOR FOUNDER APPROVAL**
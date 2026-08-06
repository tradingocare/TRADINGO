# TRADINGO® Brand Guidelines

## Brand Hierarchy

```
TRADINGO®
├── TRADHEXA™ (Six Engines Suite)
│   ├── TradConnect™ (Communication)
│   ├── TradFind™ (Search & Discovery)
│   ├── TradMatch™ (AI Matching)
│   ├── TradRFQ™ (Request for Quote)
│   ├── TradTrust™ (Trust & Scoring)
│   └── TradZero™ (Zero Defect)
├── TradeServ™ (Professional Services Marketplace)
│   ├── TradBuy™ (Buyer Professional Services)
│   └── GoLive™ / GoStart™ / GoJoin™ (Launch programs)
├── GOCASH™ (Rewards & Wallet Engine)
│   ├── GOCASH Wallet
│   ├── GOCASH Campaigns
│   ├── GOCASH Referrals
│   └── GOCASH Ecosystem (XP, Levels, Badges, Missions)
├── TRADGO™ (GOCASH Leaderboard & Rankings)
├── TradBuy™ (Buyer Experience)
└── TradGO™ (GOCASH Leaderboard)
```

## Master Brand: TRADINGO®

The enterprise B2B marketplace platform. Always stylized as **TRADINGO** (all caps, trademark symbol on first reference).

### Taglines
- **Primary**: "Where Trust Meets Trade™"
- **Secondary**: "India's Enterprise B2B Marketplace"
- **Value Prop**: "Find. Trust. Trade. Grow."
- **GOCASH Tag**: "Earn While You Trade™"

## Sub-Brands

### TRADHEXA™
The six-engine suite powering marketplace intelligence. Always TRADHEXA (not TradHexa, not Trad Hexa).

### TradeServ™
Professional services marketplace (CA, CS, GST consultants, etc.). TradeServ (not TradeServ, not Tradeserv).

### GOCASH™
Rewards, wallet, XP, levels, badges, missions, campaigns, referrals. Always GOCASH (not GoCash, not GO Cash).

### TradTrust™
Trust scoring engine (6 dimensions: profile, verification, transactions, reviews, compliance, longevity).

### TRADGO™
GOCASH leaderboard and rankings.

## Typography

- **Headings**: Inter (sans-serif, bold weights)
- **Body**: Inter (sans-serif, regular)
- **Monospace**: JetBrains Mono (code snippets)

## Color Palette

### Dark Theme (Default)
- **Background**: `#0a0a0f` (deep dark)
- **Surface**: `#1a1a2e` (card backgrounds)
- **Surface Hover**: `#232340`
- **Primary**: `#6366f1` (indigo)
- **Primary Hover**: `#818cf8`
- **Secondary**: `#06b6d4` (cyan)
- **Accent**: `#f59e0b` (amber)
- **Success**: `#10b981` (emerald)
- **Danger**: `#ef4444` (red)
- **Warning**: `#f97316` (orange)
- **Text Primary**: `#f1f5f9` (light)
- **Text Secondary**: `#94a3b8` (muted)
- **Border**: `#334155` (subtle borders)

These are the Tailwind CSS defaults used across the app. (Status: Not Yet Documented in design tokens file.)

## Spacing

Uses standard Tailwind spacing scale (4px base): `space-1` = 4px, `space-2` = 8px, `space-4` = 16px, etc.

## Logo Usage

Logo files in `apps/web/public/logo/` directory. SVG format preferred.

## Brand Voice

- **Professional**: Enterprise-grade language, no slang
- **Confident**: Direct statements, no hedging
- **Trustworthy**: Data-backed claims, transparent pricing
- **Helpful**: Solution-oriented, educational
- **Indian Heritage**: Proudly Indian, "Make in India" messaging
- **Global Reach**: English-first, multi-language support via AI translation

## Visual Style

- Modern, clean, dark-themed UI
- Gradient accents (indigo to cyan)
- Glass morphism effects on cards
- Subtle animations (Framer Motion)
- Data-rich dashboards
- Map-based discovery (Leaflet)
- Progressive web app (PWA) capabilities

## Domain Strategy (based on codebase patterns)

- `/` — Public marketing site
- `/buyer/*` — Buyer dashboard and workflows
- `/seller/*` — Seller dashboard and workflows
- `/admin/*` — Admin console
- `/tradeserv/*` — Professional services marketplace
- `/tradhexa/*` — Engine suite landing pages
- `/(auth)/*` — Authentication pages

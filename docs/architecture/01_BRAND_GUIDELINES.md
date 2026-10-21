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

The brand foundation is locked in `apps/web/app/globals.css` and exposed through
Tailwind v4 tokens. Components must consume semantic tokens (`bg-surface`,
`bg-bg-elevated`, `bg-bg-base`, `text-text-*`) rather than raw color values.

### Brand Foundation (Founder Locked)
- **Brand Primary** (nav, sidebar, header, footer): `#2C1608`
- **Brand Surface / Box**: `#100C08`
- **Page Background**: `#2C1608`
- **Accent**: `#FF4D00` (orange)
- **Accent Hover**: `#CC3D00`
- **Accent Light**: `#FF7A33`
- **Text on Primary**: `#FFFFFF`
- **Text on Surface**: `#F0F4FF`

### Dark Theme (Default)
- **Page Background**: `#2C1608`
- **Elevated Surface**: `#100C08`
- **Surface / Card / Input**: `#100C08`
- **Text Primary**: `#F0F4FF`
- **Text Secondary**: `#A8B4CC`
- **Text Tertiary**: `#94A3B8`
- **Border**: `rgba(255, 255, 255, 0.12)`
- **Success**: `#22C55E`
- **Warning**: `#F59E0B`
- **Error**: `#EF4444`
- **Info**: `#3B82F6`

### Light Theme
- **Page Background**: `#F5E3D9`
- **Elevated / Surface**: `#F8F8FF`
- **Text Primary**: `#000000`
- **Text Secondary**: `#374151`
- **Text Tertiary**: `#4B5563`
- **Primary Button**: `#2C1608` with white text

### Legacy Note
Earlier `#00001C` / `#00072D` and indigo/cyan palette values are superseded by
the locked brand foundation above and must not be reintroduced.

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
- Orange/amber accent gradients
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
